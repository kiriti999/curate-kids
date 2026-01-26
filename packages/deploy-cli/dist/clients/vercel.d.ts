/**
 * Vercel API Client
 *
 * Deploys Next.js applications to Vercel using CLI for pre-built deployments
 */
export interface VercelDeploymentOptions {
    projectName: string;
    bundlePath: string;
    envVars: Record<string, string>;
    framework: 'nextjs' | 'static';
}
export declare class VercelClient {
    private token;
    private teamId?;
    private baseUrl;
    constructor(token: string, teamId?: string | undefined);
    /**
     * Deploy a project to Vercel using CLI pre-built deployment
     */
    deploy(options: VercelDeploymentOptions): Promise<string>;
    /**
     * Deploy using Vercel CLI with pre-built output
     */
    private deployWithCLI;
    /**
     * Ensure project exists (create if not)
     */
    private ensureProject;
    /**
     * Get project by name
     */
    private getProject;
    /**
     * Create a new project
     */
    private createProject;
    /**
     * Collect all files from bundle directory
     */
    private collectFiles;
    /**
     * Create a deployment
     */
    private createDeployment;
    /**
     * Wait for deployment to complete
     */
    private waitForDeployment;
    /**
     * Set environment variables for a project
     */
    setEnvironmentVariables(projectId: string, envVars: Record<string, string>): Promise<void>;
    /**
     * Create or update a single environment variable
     */
    private createEnvironmentVariable;
    /**
     * Update an existing environment variable
     */
    private updateEnvironmentVariable;
    /**
     * Update existing environment variables
     */
    updateEnvironmentVariables(projectName: string, envVars: Record<string, string>): Promise<void>;
    /**
     * Trigger a redeployment
     */
    private triggerRedeployment;
    /**
     * Add a custom domain to a project
     */
    addDomain(projectName: string, domain: string): Promise<void>;
    /**
     * Delete a project
     */
    deleteProject(projectName: string): Promise<void>;
    /**
     * Build API URL with team parameter
     */
    private buildUrl;
    /**
     * Get request headers
     */
    private getHeaders;
}
//# sourceMappingURL=vercel.d.ts.map