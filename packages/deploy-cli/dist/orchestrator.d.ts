/**
 * Deployment Orchestrator
 *
 * Coordinates deployment to all customer infrastructure:
 * - Vercel (Frontend + CMS)
 * - Deno Deploy (Bot)
 * - MongoDB Atlas (Database)
 */
import type { DeploymentCredentials } from './utils/credentials.js';
export declare class DeploymentOrchestrator {
    private credentials;
    private licenseKey;
    private vercel;
    private deno;
    appUrl: string;
    botUrl: string;
    private deployedResources;
    private manualSetupRequired;
    constructor(credentials: DeploymentCredentials, licenseKey: string);
    /**
     * Main deployment flow
     */
    deploy(): Promise<void>;
    /**
     * Rollback deployed resources on failure
     */
    private rollback;
    /**
     * Deploy MongoDB and configure
     */
    private deployMongoDB;
    /**
     * Deploy unified App to Vercel (Frontend + CMS in one)
     */
    private deployApp;
    /**
     * Deploy Bot to Deno Deploy
     */
    private deployBot;
    /**
     * Register deployment with license server
     */
    private registerDeployment;
}
//# sourceMappingURL=orchestrator.d.ts.map