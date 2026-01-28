/**
 * Vercel API Client
 * 
 * Deploys Next.js applications to Vercel using CLI for pre-built deployments
 */

import fetch from 'node-fetch'
import { readdir, readFile, stat, writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'
import ora from 'ora'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
     * Deploy a project to Vercel using CLI pre-built deployment
     * Returns the stable production URL (not the unique deployment URL)
     */
    async deploy(options: VercelDeploymentOptions): Promise<string> {
        // Step 1: Create or get project and set env vars
        const projectId = await this.ensureProject(options.projectName)
        await this.setEnvironmentVariables(projectId, options.envVars)

        // Step 2: Build the app locally and deploy using Vercel CLI
        await this.deployWithCLI(options)

        // Step 3: Get the stable production URL from project settings
        const productionUrl = await this.getProductionUrl(options.projectName)

        // Step 4: Trigger redeployment to apply env vars from Vercel project settings
        // This ensures Next.js build-time env vars (NEXT_PUBLIC_*) are properly injected
        await this.triggerRedeployment(projectId)

        return productionUrl
    }

    /**
     * Get the stable production URL for a project
     * Gets the actual production domain from the latest production deployment
     */
    private async getProductionUrl(projectName: string): Promise<string> {
        try {
            const project = await this.getProject(projectName)

            // Method 1: Get the production deployment URL directly
            // This is the most reliable way to get the actual production URL
            const deploymentsUrl = this.buildUrl(`/v6/deployments?projectId=${project.id}&target=production&limit=1`)
            const deploymentsResponse = await fetch(deploymentsUrl, {
                headers: this.getHeaders()
            })

            if (deploymentsResponse.ok) {
                const deploymentsData = await deploymentsResponse.json() as {
                    deployments: Array<{ url: string; alias?: string[] }>
                }

                if (deploymentsData.deployments && deploymentsData.deployments.length > 0) {
                    const latestDeployment = deploymentsData.deployments[0]

                    // Check if deployment has aliases (production domains)
                    if (latestDeployment.alias && latestDeployment.alias.length > 0) {
                        // Prefer non-unique aliases (the stable production domain)
                        // Vercel aliases include both: deploy24-xyz-team.vercel.app (unique) 
                        // and deploy24-lake.vercel.app (stable)
                        const stableDomain = latestDeployment.alias.find((a: string) =>
                            a.includes('.vercel.app') && !a.includes(project.id)
                        ) || latestDeployment.alias[0]

                        return `https://${stableDomain}`
                    }

                    // Fall back to deployment URL
                    if (latestDeployment.url) {
                        return `https://${latestDeployment.url}`
                    }
                }
            }

            // Method 2: Get domains from project settings
            const domainsUrl = this.buildUrl(`/v9/projects/${project.id}/domains`)
            const domainsResponse = await fetch(domainsUrl, {
                headers: this.getHeaders()
            })

            if (domainsResponse.ok) {
                const domainsData = await domainsResponse.json() as {
                    domains: Array<{ name: string; verified: boolean }>
                }

                if (domainsData.domains && domainsData.domains.length > 0) {
                    // Prefer verified custom domains
                    const verifiedDomain = domainsData.domains.find(d => d.verified && !d.name.includes('.vercel.app'))
                    if (verifiedDomain) {
                        return `https://${verifiedDomain.name}`
                    }

                    // Otherwise use the first domain (usually the .vercel.app one)
                    return `https://${domainsData.domains[0].name}`
                }
            }

            // Method 3: Check project aliases
            if (project.alias && project.alias.length > 0) {
                return `https://${project.alias[0]}`
            }

            // Final fallback: use standard pattern (least reliable)
            console.log(`Warning: Could not determine production URL for ${projectName}, using fallback`)
            return `https://${projectName}.vercel.app`
        } catch (error) {
            console.log(`Error getting production URL: ${error}`)
            return `https://${projectName}.vercel.app`
        }
    }

    /**
     * Deploy using Vercel CLI with pre-built output
     */
    private async deployWithCLI(options: VercelDeploymentOptions): Promise<string> {
        const bundlePath = resolve(options.bundlePath)

        // Always clean and rebuild to ensure fresh build with latest dependencies
        // This prevents issues from stale node_modules or .next folders
        const buildCmd = `cd "${bundlePath}" && rm -rf .next node_modules && npm install --legacy-peer-deps && npm run build && `

        // Create vercel.json configuration
        const vercelConfig = {
            name: options.projectName,
            framework: options.framework === 'nextjs' ? 'nextjs' : null
        }

        await writeFile(
            join(bundlePath, 'vercel.json'),
            JSON.stringify(vercelConfig, null, 2)
        )

        // Deploy using Vercel CLI
        const teamArg = this.teamId ? `--scope ${this.teamId}` : ''
        const cmd = `${buildCmd}cd "${bundlePath}" && npx vercel deploy --token ${this.token} ${teamArg} --yes --prod 2>&1`

        try {
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: 600000, // 10 minute timeout
                maxBuffer: 50 * 1024 * 1024, // 50MB buffer
                env: {
                    ...process.env,
                    VERCEL_ORG_ID: this.teamId || undefined,
                    ...options.envVars
                }
            })

            // Log full output for debugging
            console.log('\n--- Vercel CLI Output ---')
            console.log(stdout)
            console.log(stderr)
            console.log('-------------------------\n')

            // Extract deployment URL from output
            const output = stdout + stderr
            // First try to find explicit Production URL
            const prodUrlMatch = output.match(/Production: (https:\/\/[^\s]+\.vercel\.app)/)
            if (prodUrlMatch) {
                return prodUrlMatch[1]
            }

            // Fallback: Extract any deployment URL from output
            const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/)
            if (urlMatch) {
                return urlMatch[0]
            }

            throw new Error(`Could not extract deployment URL from output: ${output.slice(0, 500)}`)
        } catch (error: any) {
            throw new Error(`Vercel CLI deployment failed: ${error.message}`)
        }
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

        const body: any = {
            name,
            framework: 'nextjs'
        }

        // If no team ID, explicitly set buildCommand and outputDirectory
        if (!this.teamId) {
            body.buildCommand = 'npm run build'
            body.outputDirectory = '.next'
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const error = await response.text()
            let errorObj;
            try {
                errorObj = JSON.parse(error);
            } catch {
                errorObj = { message: error };
            }

            // Better error message for auth issues
            if (errorObj.error?.invalidToken || errorObj.error?.code === 'forbidden') {
                throw new Error(`Vercel authentication failed. Please check:\n` +
                    `  1. Your token is valid (check at https://vercel.com/account/tokens)\n` +
                    `  2. The token has not expired\n` +
                    `  3. If using a team, provide the Team ID\n` +
                    `  Error: ${errorObj.error?.message || error}`)
            }

            throw new Error(`Failed to create project: ${error}`)
        }

        const project: any = await response.json()
        return project.id
    }

    /**
     * Collect all files from bundle directory
     */
    private async collectFiles(bundlePath: string): Promise<Array<{ file: string; data: string; encoding: string }>> {
        const files: Array<{ file: string; data: string; encoding: string }> = []
        const { resolve } = await import('path')
        const normalizedBase = resolve(bundlePath)

        async function walk(dir: string) {
            const entries = await readdir(dir, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = join(dir, entry.name)

                if (entry.isDirectory()) {
                    // Skip node_modules, .git, and macOS resource forks
                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('._')) {
                        continue
                    }
                    await walk(fullPath)
                } else {
                    // Skip macOS resource fork files (._*)
                    if (entry.name.startsWith('._')) {
                        continue
                    }
                    const normalizedFull = resolve(fullPath)
                    const relativePath = normalizedFull.slice(normalizedBase.length + 1)
                    const content = await readFile(fullPath)

                    files.push({
                        file: relativePath,
                        data: content.toString('base64'),
                        encoding: 'base64'
                    })
                }
            }
        }

        await walk(bundlePath)
        return files
    }

    /**
     * Create a deployment
     */
    private async createDeployment(options: {
        projectId: string
        files: Array<{ file: string; data: string; encoding: string }>
        name: string
        envVars?: Record<string, string>
    }): Promise<string> {
        const url = this.buildUrl('/v13/deployments')

        // Log file count for debugging
        console.log(`Uploading ${options.files.length} files to Vercel...`)
        const pkgFile = options.files.find(f => f.file === 'package.json')
        if (pkgFile) {
            console.log('  - package.json found')
        } else {
            console.log('  - WARNING: package.json NOT found!')
            console.log('  - Files:', options.files.slice(0, 5).map(f => f.file).join(', '), '...')
        }

        // Convert env vars to Vercel format for deployment
        const env: Record<string, string> = options.envVars || {}

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                name: options.name,
                project: options.projectId,
                files: options.files,
                projectSettings: {
                    framework: 'nextjs'
                },
                target: 'production',
                env
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Deployment failed: ${error}`)
        }

        const deployment: any = await response.json()

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

            const deployment: any = await response.json()

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
        console.log(`Setting ${Object.keys(envVars).length} environment variables for project ${projectId}...`)
        for (const [key, value] of Object.entries(envVars)) {
            console.log(`  - Setting ${key}`)
            await this.createEnvironmentVariable(projectId, key, value)
        }
        console.log('✓ All environment variables set')
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

        if (!response.ok) {
            const error = await response.text()
            // If env var already exists, try to update it
            if (error.includes('ENV_CONFLICT') || response.status === 409) {
                console.log(`    (updating existing ${key})`)
                await this.updateEnvironmentVariable(projectId, key, value)
                return
            }
            console.error(`Failed to set env var ${key}: ${error}`)
            throw new Error(`Failed to set env var ${key}: ${error}`)
        }
    }

    /**
     * Update an existing environment variable
     */
    private async updateEnvironmentVariable(
        projectId: string,
        key: string,
        value: string
    ): Promise<void> {
        // First get the env var ID
        const listUrl = this.buildUrl(`/v10/projects/${projectId}/env`)
        const listResponse = await fetch(listUrl, {
            headers: this.getHeaders()
        })

        if (!listResponse.ok) {
            throw new Error(`Failed to list env vars for update: ${await listResponse.text()}`)
        }

        const data = await listResponse.json() as { envs: Array<{ id: string, key: string }> }
        const envVar = data.envs.find(e => e.key === key)

        if (!envVar) {
            throw new Error(`Env var ${key} not found for update`)
        }

        // Update the env var
        const updateUrl = this.buildUrl(`/v10/projects/${projectId}/env/${envVar.id}`)
        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
                value,
                type: 'encrypted',
                target: ['production', 'preview', 'development']
            })
        })

        if (!updateResponse.ok) {
            const error = await updateResponse.text()
            throw new Error(`Failed to update env var ${key}: ${error}`)
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

        const deployments: any = await deploymentsResponse.json()
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
     * Delete a project
     */
    async deleteProject(projectName: string): Promise<void> {
        try {
            const project = await this.getProject(projectName)
            const url = this.buildUrl(`/v9/projects/${project.id}`)

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders()
            })

            if (!response.ok) {
                throw new Error(`Failed to delete project: ${await response.text()}`)
            }
        } catch (error) {
            // Ignore if project doesn't exist
            if (error instanceof Error && error.message.includes('not found')) {
                return
            }
            throw error
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
