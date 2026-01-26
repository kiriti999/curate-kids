/**
 * Vercel API Client
 *
 * Deploys Next.js applications to Vercel using CLI for pre-built deployments
 */
import fetch from 'node-fetch';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class VercelClient {
    token;
    teamId;
    baseUrl = 'https://api.vercel.com';
    constructor(token, teamId) {
        this.token = token;
        this.teamId = teamId;
    }
    /**
     * Deploy a project to Vercel using CLI pre-built deployment
     */
    async deploy(options) {
        // Step 1: Create or get project and set env vars
        const projectId = await this.ensureProject(options.projectName);
        await this.setEnvironmentVariables(projectId, options.envVars);
        // Step 2: Build the app locally and deploy using Vercel CLI
        const deploymentUrl = await this.deployWithCLI(options);
        return deploymentUrl;
    }
    /**
     * Deploy using Vercel CLI with pre-built output
     */
    async deployWithCLI(options) {
        const bundlePath = resolve(options.bundlePath);
        // Check if there's a .next folder (pre-built) or source files
        const hasNextBuild = await stat(join(bundlePath, '.next')).catch(() => null);
        // Create vercel.json configuration
        const vercelConfig = {
            name: options.projectName,
            framework: options.framework === 'nextjs' ? 'nextjs' : null
        };
        await writeFile(join(bundlePath, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
        // Build command if no .next exists
        let buildCmd = '';
        if (!hasNextBuild) {
            // Need to build first - use legacy-peer-deps to handle PayloadCMS version conflicts
            buildCmd = `cd "${bundlePath}" && npm install --legacy-peer-deps && npm run build && `;
        }
        // Deploy using Vercel CLI
        const teamArg = this.teamId ? `--scope ${this.teamId}` : '';
        const cmd = `${buildCmd}cd "${bundlePath}" && npx vercel deploy --token ${this.token} ${teamArg} --yes --prod 2>&1`;
        try {
            const { stdout, stderr } = await execAsync(cmd, {
                timeout: 600000, // 10 minute timeout
                maxBuffer: 50 * 1024 * 1024, // 50MB buffer
                env: {
                    ...process.env,
                    VERCEL_ORG_ID: this.teamId || undefined,
                    ...options.envVars
                }
            });
            // Extract deployment URL from output
            const output = stdout + stderr;
            const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
            if (urlMatch) {
                return urlMatch[0];
            }
            // If no URL found, check for production URL
            const prodUrlMatch = output.match(/Production: (https:\/\/[^\s]+)/);
            if (prodUrlMatch) {
                return prodUrlMatch[1];
            }
            throw new Error(`Could not extract deployment URL from output: ${output.slice(0, 500)}`);
        }
        catch (error) {
            throw new Error(`Vercel CLI deployment failed: ${error.message}`);
        }
    }
    /**
     * Ensure project exists (create if not)
     */
    async ensureProject(name) {
        // Try to get existing project
        try {
            const project = await this.getProject(name);
            return project.id;
        }
        catch {
            // Project doesn't exist, create it
            return await this.createProject(name);
        }
    }
    /**
     * Get project by name
     */
    async getProject(name) {
        const url = this.buildUrl('/v9/projects/' + encodeURIComponent(name));
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
        const url = this.buildUrl('/v10/projects');
        const body = {
            name,
            framework: 'nextjs'
        };
        // If no team ID, explicitly set buildCommand and outputDirectory
        if (!this.teamId) {
            body.buildCommand = 'npm run build';
            body.outputDirectory = '.next';
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = await response.text();
            let errorObj;
            try {
                errorObj = JSON.parse(error);
            }
            catch {
                errorObj = { message: error };
            }
            // Better error message for auth issues
            if (errorObj.error?.invalidToken || errorObj.error?.code === 'forbidden') {
                throw new Error(`Vercel authentication failed. Please check:\n` +
                    `  1. Your token is valid (check at https://vercel.com/account/tokens)\n` +
                    `  2. The token has not expired\n` +
                    `  3. If using a team, provide the Team ID\n` +
                    `  Error: ${errorObj.error?.message || error}`);
            }
            throw new Error(`Failed to create project: ${error}`);
        }
        const project = await response.json();
        return project.id;
    }
    /**
     * Collect all files from bundle directory
     */
    async collectFiles(bundlePath) {
        const files = [];
        const { resolve } = await import('path');
        const normalizedBase = resolve(bundlePath);
        async function walk(dir) {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    // Skip node_modules, .git, and macOS resource forks
                    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('._')) {
                        continue;
                    }
                    await walk(fullPath);
                }
                else {
                    // Skip macOS resource fork files (._*)
                    if (entry.name.startsWith('._')) {
                        continue;
                    }
                    const normalizedFull = resolve(fullPath);
                    const relativePath = normalizedFull.slice(normalizedBase.length + 1);
                    const content = await readFile(fullPath);
                    files.push({
                        file: relativePath,
                        data: content.toString('base64'),
                        encoding: 'base64'
                    });
                }
            }
        }
        await walk(bundlePath);
        return files;
    }
    /**
     * Create a deployment
     */
    async createDeployment(options) {
        const url = this.buildUrl('/v13/deployments');
        // Log file count for debugging
        console.log(`Uploading ${options.files.length} files to Vercel...`);
        const pkgFile = options.files.find(f => f.file === 'package.json');
        if (pkgFile) {
            console.log('  - package.json found');
        }
        else {
            console.log('  - WARNING: package.json NOT found!');
            console.log('  - Files:', options.files.slice(0, 5).map(f => f.file).join(', '), '...');
        }
        // Convert env vars to Vercel format for deployment
        const env = options.envVars || {};
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
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Deployment failed: ${error}`);
        }
        const deployment = await response.json();
        // Wait for deployment to be ready
        await this.waitForDeployment(deployment.id);
        return deployment.url;
    }
    /**
     * Wait for deployment to complete
     */
    async waitForDeployment(deploymentId) {
        const maxAttempts = 120; // 10 minutes
        const interval = 5000; // 5 seconds
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const url = this.buildUrl(`/v13/deployments/${deploymentId}`);
            const response = await fetch(url, {
                headers: this.getHeaders()
            });
            if (!response.ok) {
                throw new Error('Failed to check deployment status');
            }
            const deployment = await response.json();
            if (deployment.readyState === 'READY') {
                return;
            }
            if (deployment.readyState === 'ERROR') {
                throw new Error('Deployment failed on Vercel');
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('Deployment timeout');
    }
    /**
     * Set environment variables for a project
     */
    async setEnvironmentVariables(projectId, envVars) {
        for (const [key, value] of Object.entries(envVars)) {
            await this.createEnvironmentVariable(projectId, key, value);
        }
    }
    /**
     * Create or update a single environment variable
     */
    async createEnvironmentVariable(projectId, key, value) {
        const url = this.buildUrl(`/v10/projects/${projectId}/env`);
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                key,
                value,
                type: 'encrypted',
                target: ['production', 'preview', 'development']
            })
        });
        if (!response.ok) {
            const error = await response.text();
            // If env var already exists, try to update it
            if (error.includes('ENV_CONFLICT') || response.status === 409) {
                await this.updateEnvironmentVariable(projectId, key, value);
                return;
            }
            throw new Error(`Failed to set env var ${key}: ${error}`);
        }
    }
    /**
     * Update an existing environment variable
     */
    async updateEnvironmentVariable(projectId, key, value) {
        // First get the env var ID
        const listUrl = this.buildUrl(`/v10/projects/${projectId}/env`);
        const listResponse = await fetch(listUrl, {
            headers: this.getHeaders()
        });
        if (!listResponse.ok) {
            throw new Error(`Failed to list env vars for update: ${await listResponse.text()}`);
        }
        const data = await listResponse.json();
        const envVar = data.envs.find(e => e.key === key);
        if (!envVar) {
            throw new Error(`Env var ${key} not found for update`);
        }
        // Update the env var
        const updateUrl = this.buildUrl(`/v10/projects/${projectId}/env/${envVar.id}`);
        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
                value,
                type: 'encrypted',
                target: ['production', 'preview', 'development']
            })
        });
        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            throw new Error(`Failed to update env var ${key}: ${error}`);
        }
    }
    /**
     * Update existing environment variables
     */
    async updateEnvironmentVariables(projectName, envVars) {
        const project = await this.getProject(projectName);
        await this.setEnvironmentVariables(project.id, envVars);
        // Trigger redeployment to apply new env vars
        await this.triggerRedeployment(project.id);
    }
    /**
     * Trigger a redeployment
     */
    async triggerRedeployment(projectId) {
        const url = this.buildUrl(`/v13/deployments`);
        // Get latest deployment and redeploy it
        const deploymentsUrl = this.buildUrl(`/v6/deployments?projectId=${projectId}&limit=1`);
        const deploymentsResponse = await fetch(deploymentsUrl, {
            headers: this.getHeaders()
        });
        const deployments = await deploymentsResponse.json();
        if (deployments.deployments && deployments.deployments[0]) {
            const latestDeployment = deployments.deployments[0];
            await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    deploymentId: latestDeployment.uid,
                    target: 'production'
                })
            });
        }
    }
    /**
     * Add a custom domain to a project
     */
    async addDomain(projectName, domain) {
        const project = await this.getProject(projectName);
        const url = this.buildUrl(`/v10/projects/${project.id}/domains`);
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ name: domain })
        });
        if (!response.ok && response.status !== 409) {
            const error = await response.text();
            throw new Error(`Failed to add domain: ${error}`);
        }
    }
    /**
     * Delete a project
     */
    async deleteProject(projectName) {
        try {
            const project = await this.getProject(projectName);
            const url = this.buildUrl(`/v9/projects/${project.id}`);
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            if (!response.ok) {
                throw new Error(`Failed to delete project: ${await response.text()}`);
            }
        }
        catch (error) {
            // Ignore if project doesn't exist
            if (error instanceof Error && error.message.includes('not found')) {
                return;
            }
            throw error;
        }
    }
    /**
     * Build API URL with team parameter
     */
    buildUrl(path) {
        const url = new URL(path, this.baseUrl);
        if (this.teamId) {
            url.searchParams.set('teamId', this.teamId);
        }
        return url.toString();
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
//# sourceMappingURL=vercel.js.map