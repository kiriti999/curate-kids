/**
 * Credentials Collection
 *
 * Interactive prompts to collect customer's infrastructure credentials
 */
import prompts from 'prompts';
import chalk from 'chalk';
export async function collectCredentials() {
    console.log(chalk.gray('\nWe need your infrastructure credentials to deploy CuratedReels.\n'));
    console.log(chalk.white('Required services:'));
    console.log(chalk.gray('  • Vercel (hosting)'));
    console.log(chalk.gray('  • Deno Deploy (bot)'));
    console.log(chalk.gray('  • MongoDB Atlas (database)'));
    console.log(chalk.gray('  • Telegram Bot API\n'));
    const credentials = await prompts([
        // Project Configuration
        {
            type: 'text',
            name: 'projectName',
            message: 'Project name (lowercase, no spaces):',
            validate: (value) => {
                if (!/^[a-z0-9-]+$/.test(value)) {
                    return 'Only lowercase letters, numbers, and hyphens allowed';
                }
                if (value.length < 3 || value.length > 32) {
                    return 'Must be between 3-32 characters';
                }
                return true;
            }
        },
        // Vercel
        {
            type: 'password',
            name: 'vercelToken',
            message: 'Vercel API Token:',
            validate: (value) => {
                return true;
            }
        },
        {
            type: 'text',
            name: 'vercelTeamId',
            message: 'Vercel Team ID (optional, press Enter to skip):',
            initial: ''
        },
        // Deno Deploy
        {
            type: 'password',
            name: 'denoToken',
            message: 'Deno Deploy Access Token:',
            validate: (value) => value.length > 20 || 'Invalid Deno token'
        },
        {
            type: 'text',
            name: 'denoOrg',
            message: 'Deno Organization (optional, press Enter to skip):',
            initial: ''
        },
        // MongoDB
        {
            type: 'text',
            name: 'mongodbUri',
            message: 'MongoDB Atlas Connection URI:',
            validate: (value) => {
                if (!value.startsWith('mongodb+srv://') && !value.startsWith('mongodb://')) {
                    return 'Invalid MongoDB URI (should start with "mongodb+srv://" or "mongodb://")';
                }
                return true;
            }
        },
        // Telegram
        {
            type: 'password',
            name: 'telegramBotToken',
            message: 'Telegram Bot Token:',
            validate: (value) => {
                if (!/^\d+:.+/.test(value)) {
                    return 'Invalid bot token format (should be like "123456:ABC-DEF1234")';
                }
                return true;
            }
        },
        {
            type: 'text',
            name: 'telegramGroupId',
            message: 'Telegram Group ID (optional, can set later):',
            initial: ''
        },
        // Optional services
        {
            type: 'confirm',
            name: 'enableCloudinary',
            message: 'Enable Cloudinary for video uploads?',
            initial: true
        }
    ]);
    // Cloudinary (conditional)
    if (credentials.enableCloudinary) {
        const cloudinary = await prompts([
            {
                type: 'text',
                name: 'cloudinaryCloudName',
                message: 'Cloudinary Cloud Name:'
            },
            {
                type: 'password',
                name: 'cloudinaryApiKey',
                message: 'Cloudinary API Key:'
            },
            {
                type: 'password',
                name: 'cloudinaryApiSecret',
                message: 'Cloudinary API Secret:'
            }
        ]);
        credentials.cloudinaryCloudName = cloudinary.cloudinaryCloudName;
        credentials.cloudinaryApiKey = cloudinary.cloudinaryApiKey;
        credentials.cloudinaryApiSecret = cloudinary.cloudinaryApiSecret;
    }
    // YouTube API (optional)
    const { enableYoutube } = await prompts({
        type: 'confirm',
        name: 'enableYoutube',
        message: 'Enable YouTube metadata extraction?',
        initial: false
    });
    if (enableYoutube) {
        const { youtubeApiKey } = await prompts({
            type: 'password',
            name: 'youtubeApiKey',
            message: 'YouTube Data API Key:'
        });
        credentials.youtubeApiKey = youtubeApiKey;
    }
    // Custom domain (optional)
    const { useCustomDomain } = await prompts({
        type: 'confirm',
        name: 'useCustomDomain',
        message: 'Add custom domain for frontend?',
        initial: false
    });
    if (useCustomDomain) {
        const { customDomain } = await prompts({
            type: 'text',
            name: 'customDomain',
            message: 'Custom domain (e.g., app.yourdomain.com):',
            validate: (value) => {
                if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(value)) {
                    return 'Invalid domain format';
                }
                return true;
            }
        });
        credentials.customDomain = customDomain;
    }
    return credentials;
}
/**
 * Validate credentials format
 */
export function validateCredentials(credentials) {
    const required = [
        'vercelToken',
        'denoToken',
        'mongodbUri',
        'telegramBotToken',
        'projectName'
    ];
    for (const field of required) {
        if (!credentials[field]) {
            throw new Error(`Missing required credential: ${field}`);
        }
    }
    return true;
}
//# sourceMappingURL=credentials.js.map