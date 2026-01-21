/**
 * Deno Deploy API Client
 * 
 * Deploys Deno applications to Deno Deploy
 */

import fetch from 'node-fetch'
import { readFile } from 'fs/promises'

export interface DenoDeploymentOptions {
    projectName: string
    entrypoint: string
    envVars: Record<string, string>
}

export class DenoClient {
    private baseUrl = 'https://api.deno.com/v1'

    constructor(
        private token: string,
        private org?: string
    ) { }

    /**
     * Deploy a project to Deno Deploy
     */
    async deploy(options: DenoDeploymentOptions): Promise<string> {
        // Step 1: Ensure project exists
        const projectId = await this.ensureProject(options.projectName)

        // Step 2: Upload deployment assets
        const url = await this.createDeployment(projectId, options.entrypoint)

        // Step 3: Set environment variables
        await this.setEnvironmentVariables(projectId, options.envVars)

        return url
    }

    /**
     * Ensure project exists (create if not)
     */
    private async ensureProject(name: string): Promise<string> {
        try {
            const project = await this.getProject(name)
            return project.id
        } catch {
            return await this.createProject(name)
        }
    }

    /**
     * Get project by name
     */
    private async getProject(name: string): Promise<any> {
        const url = `${this.baseUrl}/projects/${name}`

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
        const url = `${this.baseUrl}/projects`

        const body: any = { name }
        if (this.org) {
            body.organizationId = this.org
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to create project: ${error}`)
        }

        const project: any = await response.json()
        return project.id
    }

    /**
     * Create a deployment
     */
    private async createDeployment(
        projectId: string,
        entrypointPath: string
    ): Promise<string> {
        // Read the bundled bot file
        const code = await readFile(entrypointPath, 'utf-8')

        const url = `${this.baseUrl}/projects/${projectId}/deployments`

        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                entryPointUrl: 'main.ts',
                assets: {
                    'main.ts': {
                        kind: 'file',
                        content: code,
                        encoding: 'utf-8'
                    }
                },
                envVars: {}, // Will be set separately
                productionDeployment: true
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Deployment failed: ${error}`)
        }

        const deployment: any = await response.json()

        // Wait for deployment to be ready
        await this.waitForDeployment(projectId, deployment.id)

        return `https://${projectId}.deno.dev`
    }

    /**
     * Wait for deployment to complete
     */
    private async waitForDeployment(
        projectId: string,
        deploymentId: string
    ): Promise<void> {
        const maxAttempts = 60 // 5 minutes
        const interval = 5000 // 5 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const url = `${this.baseUrl}/deployments/${deploymentId}`

            const response = await fetch(url, {
                headers: this.getHeaders()
            })

            if (!response.ok) {
                throw new Error('Failed to check deployment status')
            }

            const deployment: any = await response.json()

            if (deployment.status === 'success') {
                return
            }

            if (deployment.status === 'failed') {
                throw new Error(`Deployment failed: ${deployment.error || 'Unknown error'}`)
            }

            await new Promise(resolve => setTimeout(resolve, interval))
        }

        throw new Error('Deployment timeout')
    }

    /**
     * Set environment variables
     */
    async setEnvironmentVariables(
        projectId: string,
        envVars: Record<string, string>
    ): Promise<void> {
        const url = `${this.baseUrl}/projects/${projectId}/env`

        const variables = Object.entries(envVars).map(([key, value]) => ({
            key,
            value
        }))

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({ variables })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to set environment variables: ${error}`)
        }
    }

    /**
     * Update project settings
     */
    async updateProject(projectId: string, settings: {
        name?: string
        description?: string
    }): Promise<void> {
        const url = `${this.baseUrl}/projects/${projectId}`

        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(settings)
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to update project: ${error}`)
        }
    }

    /**
     * List all deployments for a project
     */
    async listDeployments(projectId: string): Promise<any[]> {
        const url = `${this.baseUrl}/projects/${projectId}/deployments`

        const response = await fetch(url, {
            headers: this.getHeaders()
        })

        if (!response.ok) {
            throw new Error('Failed to list deployments')
        }

        const data: any = await response.json()
        return data.deployments || []
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId: string): Promise<void> {
        const url = `${this.baseUrl}/projects/${projectId}`

        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders()
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Failed to delete project: ${error}`)
        }
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
