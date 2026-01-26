/**
 * Credentials Collection
 *
 * Interactive prompts to collect customer's infrastructure credentials
 */
export interface DeploymentCredentials {
    vercelToken: string;
    vercelTeamId?: string;
    denoToken: string;
    denoOrg?: string;
    mongodbUri: string;
    telegramBotToken: string;
    telegramGroupId?: string;
    adminEmail: string;
    adminPassword: string;
    adminName?: string;
    cloudinaryCloudName?: string;
    cloudinaryApiKey?: string;
    cloudinaryApiSecret?: string;
    youtubeApiKey?: string;
    projectName: string;
    customDomain?: string;
}
export declare function collectCredentials(): Promise<DeploymentCredentials>;
/**
 * Validate credentials format
 */
export declare function validateCredentials(credentials: DeploymentCredentials): boolean;
//# sourceMappingURL=credentials.d.ts.map