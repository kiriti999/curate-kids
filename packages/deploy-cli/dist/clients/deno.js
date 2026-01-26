/**
 * Deno Deploy Client
 *
 * Deploys Deno applications to Deno Deploy using deployctl CLI
 */
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class DenoClient {
    token;
    org;
    baseUrl = 'https://dash.deno.com/api';
    constructor(token, org) {
        this.token = token;
        this.org = org;
    }
    /**
     * Deploy a project to Deno Deploy using deployctl
     */
    async deploy(options) {
        // Step 1: Ensure project exists and get project name
        const { name: projectName } = await this.ensureProject(options.projectName);
        // Step 2: Deploy using deployctl with environment variables
        const url = await this.deployWithCLI(projectName, options.entrypoint, options.envVars);
        return url;
    }
    /**
     * Deploy using deployctl CLI with environment variables
     */
    async deployWithCLI(projectName, deployDir, envVars) {
        const deployctlPath = `${process.env.HOME}/.deno/bin/deployctl`;
        // Build --env flags for each environment variable
        const envFlags = Object.entries(envVars)
            .map(([key, value]) => `--env='${key}=${value.replace(/'/g, "'\\''")}'`)
            .join(' ');
        try {
            const { stdout, stderr } = await execAsync(`cd "${deployDir}" && DENO_DEPLOY_TOKEN=${this.token} "${deployctlPath}" deploy --project=${projectName} --entrypoint=src/main.ts ${envFlags} --prod 2>&1`, { timeout: 300000 } // 5 minute timeout
            );
            const output = stdout + stderr;
            // Extract deployment URL
            const urlMatch = output.match(/https:\/\/[^\s]+\.deno\.dev/);
            if (urlMatch) {
                return urlMatch[0];
            }
            throw new Error(`Could not extract deployment URL: ${output.slice(0, 500)}`);
        }
        catch (error) {
            // If deployctl not found, try installing it
            if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
                throw new Error('deployctl not found. Please install Deno and run: deno install -Arf jsr:@deno/deployctl');
            }
            throw new Error(`Deno Deploy failed: ${error.message}`);
        }
    }
    /**
     * Ensure project exists (create if not)
     */
    async ensureProject(name) {
        try {
            const project = await this.getProject(name);
            return { name: project.name, id: project.id };
        }
        catch {
            const newProjectId = await this.createProject(name);
            return { name, id: newProjectId };
        }
    }
    /**
     * Get project by name
     */
    async getProject(name) {
        const url = `${this.baseUrl}/projects/${name}`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        if (!response.ok) {
            throw new Error(`Project not found: ${name}`);
        }
        return await response.json();
    }
    /**
     * Create a new project
     */
    async createProject(name) {
        const url = `${this.baseUrl}/projects`;
        const body = { name };
        if (this.org) {
            body.organizationId = this.org;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create project: ${error}`);
        }
        const project = await response.json();
        return project.id; // Return ID
    }
    /**
     * Update project settings
     */
    async updateProject(projectId, settings) {
        const url = `${this.baseUrl}/projects/${projectId}`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(settings)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to update project: ${error}`);
        }
    }
    /**
     * List all deployments for a project
     */
    async listDeployments(projectId) {
        const url = `${this.baseUrl}/projects/${projectId}/deployments`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        if (!response.ok) {
            throw new Error('Failed to list deployments');
        }
        const data = await response.json();
        return data.deployments || [];
    }
    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const url = `${this.baseUrl}/projects/${projectId}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete project: ${error}`);
        }
    }
    /**
     * Get request headers
     */
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}
//# sourceMappingURL=deno.js.map