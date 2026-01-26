/**
 * Deno Deploy Client
 * 
 * Deploys Deno applications to Deno Deploy using deployctl CLI
 */

import fetch from 'node-fetch'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface DenoDeploymentOptions {
    projectName: string
    entrypoint: string  // Directory containing deno.json and src/main.ts
    envVars: Record<string, string>
}

export class DenoClient {
    private baseUrl = 'https://dash.deno.com/api'

    constructor(
        private token: string,
        private org?: string
    ) { }

    /**
     * Deploy a project to Deno Deploy using deployctl
     */
    async deploy(options: DenoDeploymentOptions): Promise<string> {
        // Step 1: Ensure project exists and get project name
        const { name: projectName } = await this.ensureProject(options.projectName)

        // Step 2: Deploy using deployctl with environment variables
        const url = await this.deployWithCLI(projectName, options.entrypoint, options.envVars)

        return url
    }

    /**
     * Deploy using deployctl CLI with environment variables
     */
    private async deployWithCLI(projectName: string, deployDir: string, envVars: Record<string, string>): Promise<string> {
        const deployctlPath = `${process.env.HOME}/.deno/bin/deployctl`
        
        // Build --env flags for each environment variable
        const envFlags = Object.entries(envVars)
            .map(([key, value]) => `--env='${key}=${value.replace(/'/g, "'\\''")}'`)
            .join(' ')
        
        try {
            const { stdout, stderr } = await execAsync(
                `cd "${deployDir}" && DENO_DEPLOY_TOKEN=${this.token} "${deployctlPath}" deploy --project=${projectName} --entrypoint=src/main.ts ${envFlags} --prod 2>&1`,
                { timeout: 300000 } // 5 minute timeout
            )

            const output = stdout + stderr

            // Extract deployment URL
            const urlMatch = output.match(/https:\/\/[^\s]+\.deno\.dev/)
            if (urlMatch) {
                return urlMatch[0]
            }

            throw new Error(`Could not extract deployment URL: ${output.slice(0, 500)}`)
        } catch (error: any) {
            // If deployctl not found, try installing it
            if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
                throw new Error('deployctl not found. Please install Deno and run: deno install -Arf jsr:@deno/deployctl')
            }
            throw new Error(`Deno Deploy failed: ${error.message}`)
        }
    }

    /**
     * Ensure project exists (create if not)
     */
    private async ensureProject(name: string): Promise<{ name: string, id: string }> {
        try {
            const project = await this.getProject(name)
            return { name: project.name, id: project.id }
        } catch {
            const newProjectId = await this.createProject(name)
            return { name, id: newProjectId }
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
        return project.id  // Return ID
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
