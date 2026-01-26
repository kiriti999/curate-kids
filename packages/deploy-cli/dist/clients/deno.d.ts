/**
 * Deno Deploy Client
 *
 * Deploys Deno applications to Deno Deploy using deployctl CLI
 */
export interface DenoDeploymentOptions {
    projectName: string;
    entrypoint: string;
    envVars: Record<string, string>;
}
export declare class DenoClient {
    private token;
    private org?;
    private baseUrl;
    constructor(token: string, org?: string | undefined);
    /**
     * Deploy a project to Deno Deploy using deployctl
     */
    deploy(options: DenoDeploymentOptions): Promise<string>;
    /**
     * Deploy using deployctl CLI with environment variables
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
     * Update project settings
     */
    updateProject(projectId: string, settings: {
        name?: string;
        description?: string;
    }): Promise<void>;
    /**
     * List all deployments for a project
     */
    listDeployments(projectId: string): Promise<any[]>;
    /**
     * Delete a project
     */
    deleteProject(projectId: string): Promise<void>;
    /**
     * Get request headers
     */
    private getHeaders;
}
//# sourceMappingURL=deno.d.ts.map