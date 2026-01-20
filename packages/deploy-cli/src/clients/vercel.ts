/**
 * Vercel API Client
 * 
 * Deploys Next.js applications to Vercel
 */

import fetch from 'node-fetch'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import ora from 'ora'

export interface VercelDeploymentOptions {
    projectName: string
    bundlePath: string
    envVars: Record<string, string>
    framework: 'nextjs' | 'static'
}

export class VercelClient {
    private baseUrl = 'https://api.vercel.com'

    constructor(
        private token: string,
        private teamId?: string
    ) { }

    /**
     * Deploy a project to Vercel
     */
    async deploy(options: VercelDeploymentOptions): Promise<string> {
        // Step 1: Create or get project
        const projectId = await this.ensureProject(options.projectName)

        // Step 2: Upload files
        const files = await this.collectFiles(options.bundlePath)

        // Step 3: Create deployment
        const deploymentUrl = await this.createDeployment({
            projectId,
            files,
            name: options.projectName
        })

        // Step 4: Set environment variables
        await this.setEnvironmentVariables(projectId, options.envVars)

        return `https://${deploymentUrl}`
    }

    /**
     * Ensure project exists (create if not)
     */
    private async ensureProject(name: string): Promise<string> {
        // Try to get existing project
        try {
            const project = await this.getProject(name)
            return project.id
        } catch {
            // Project doesn't exist, create it
            return await this.createProject(name)
        }
    }

    /**
     * Get project by name
     */
    private async getProject(name: string): Promise<any> {
        const url = this.buildUrl('/v9/projects/' + encodeURIComponent(name))

        const response = await fetch(url, {
            headers: this.getHeaders()
        })

        if (!response.ok) {
            throw new Error(`Project not found: ${name}`)
        }

        return await response.json()
    }

    /**
     * Create a new project
     */
    private async createProject(name: string): Promise<string> {
        const url = this.buildUrl('/v10/projects')

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                name,
                framework: 'nextjs',
                buildCommand: null, // Pre-built
                devCommand: null,
                installCommand: null,
                outputDirectory: null
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to create project: ${error}`)
        }

        const project = await response.json()
        return project.id
    }

    /**
     * Collect all files from bundle directory
     */
    private async collectFiles(bundlePath: string): Promise<Array<{ file: string; data: string }>> {
        const files: Array<{ file: string; data: string }> = []

        async function walk(dir: string, baseDir: string) {
            const entries = await readdir(dir, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = join(dir, entry.name)

                if (entry.isDirectory()) {
                    // Skip node_modules and .git
                    if (entry.name === 'node_modules' || entry.name === '.git') {
                        continue
                    }
                    await walk(fullPath, baseDir)
                } else {
                    const relativePath = fullPath.slice(baseDir.length + 1)
                    const content = await readFile(fullPath)

                    files.push({
                        file: relativePath,
                        data: content.toString('base64')
                    })
                }
            }
        }

        await walk(bundlePath, bundlePath)
        return files
    }

    /**
     * Create a deployment
     */
    private async createDeployment(options: {
        projectId: string
        files: Array<{ file: string; data: string }>
        name: string
    }): Promise<string> {
        const url = this.buildUrl('/v13/deployments')

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                name: options.name,
                files: options.files,
                projectSettings: {
                    framework: 'nextjs',
                    buildCommand: null,
                    installCommand: null
                },
                target: 'production'
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Deployment failed: ${error}`)
        }

        const deployment = await response.json()

        // Wait for deployment to be ready
        await this.waitForDeployment(deployment.id)

        return deployment.url
    }

    /**
     * Wait for deployment to complete
     */
    private async waitForDeployment(deploymentId: string): Promise<void> {
        const maxAttempts = 120 // 10 minutes
        const interval = 5000 // 5 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const url = this.buildUrl(`/v13/deployments/${deploymentId}`)

            const response = await fetch(url, {
                headers: this.getHeaders()
            })

            if (!response.ok) {
                throw new Error('Failed to check deployment status')
            }

            const deployment = await response.json()

            if (deployment.readyState === 'READY') {
                return
            }

            if (deployment.readyState === 'ERROR') {
                throw new Error('Deployment failed on Vercel')
            }

            await new Promise(resolve => setTimeout(resolve, interval))
        }

        throw new Error('Deployment timeout')
    }

    /**
     * Set environment variables for a project
     */
    async setEnvironmentVariables(
        projectId: string,
        envVars: Record<string, string>
    ): Promise<void> {
        for (const [key, value] of Object.entries(envVars)) {
            await this.createEnvironmentVariable(projectId, key, value)
        }
    }

    /**
     * Create or update a single environment variable
     */
    private async createEnvironmentVariable(
        projectId: string,
        key: string,
        value: string
    ): Promise<void> {
        const url = this.buildUrl(`/v10/projects/${projectId}/env`)

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                key,
                value,
                type: 'encrypted',
                target: ['production', 'preview', 'development']
            })
        })

        if (!response.ok && response.status !== 409) { // 409 = already exists
            const error = await response.text()
            throw new Error(`Failed to set env var ${key}: ${error}`)
        }
    }

    /**
     * Update existing environment variables
     */
    async updateEnvironmentVariables(
        projectName: string,
        envVars: Record<string, string>
    ): Promise<void> {
        const project = await this.getProject(projectName)
        await this.setEnvironmentVariables(project.id, envVars)

        // Trigger redeployment to apply new env vars
        await this.triggerRedeployment(project.id)
    }

    /**
     * Trigger a redeployment
     */
    private async triggerRedeployment(projectId: string): Promise<void> {
        const url = this.buildUrl(`/v13/deployments`)

        // Get latest deployment and redeploy it
        const deploymentsUrl = this.buildUrl(`/v6/deployments?projectId=${projectId}&limit=1`)
        const deploymentsResponse = await fetch(deploymentsUrl, {
            headers: this.getHeaders()
        })

        const deployments = await deploymentsResponse.json()
        if (deployments.deployments && deployments.deployments[0]) {
            const latestDeployment = deployments.deployments[0]

            await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    deploymentId: latestDeployment.uid,
                    target: 'production'
                })
            })
        }
    }

    /**
     * Add a custom domain to a project
     */
    async addDomain(projectName: string, domain: string): Promise<void> {
        const project = await this.getProject(projectName)
        const url = this.buildUrl(`/v10/projects/${project.id}/domains`)

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ name: domain })
        })

        if (!response.ok && response.status !== 409) {
            const error = await response.text()
            throw new Error(`Failed to add domain: ${error}`)
        }
    }

    /**
     * Build API URL with team parameter
     */
    private buildUrl(path: string): string {
        const url = new URL(path, this.baseUrl)
        if (this.teamId) {
            url.searchParams.set('teamId', this.teamId)
        }
        return url.toString()
    }

    /**
     * Get request headers
     */
    private getHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        }
    }
}
