#!/usr/bin/env node

/**
 * CuratedReels Deployment CLI
 * 
 * White-label deployment tool that deploys CuratedReels to customer's
 * infrastructure without exposing source code.
 */

import prompts from 'prompts'
import chalk from 'chalk'
import ora from 'ora'
import { DeploymentOrchestrator } from './orchestrator.js'
import { verifyLicense, mockVerifyLicense } from './services/license.js'
import { collectCredentials, DeploymentCredentials } from './utils/credentials.js'
import { downloadBundles, mockDownloadBundles, type BundleManifest } from './services/bundles.js'

const VERSION = '1.0.0'

// Check if running in CI mode with env vars
const isEnvMode = process.env.DEPLOY_CLI_ENV_MODE === 'true'

/**
 * Get credentials from environment variables (for CI/testing)
 */
function getEnvCredentials(): DeploymentCredentials | null {
    const required = ['PROJECT_NAME', 'VERCEL_TOKEN', 'DENO_TOKEN', 'MONGODB_URI', 'TELEGRAM_BOT_TOKEN']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
        return null
    }

    return {
        projectName: process.env.PROJECT_NAME!,
        vercelToken: process.env.VERCEL_TOKEN!,
        vercelTeamId: process.env.VERCEL_TEAM_ID,
        denoToken: process.env.DENO_TOKEN!,
        denoOrg: process.env.DENO_ORG,
        mongodbUri: process.env.MONGODB_URI!,
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
        telegramGroupId: process.env.TELEGRAM_GROUP_ID,
        adminEmail: process.env.ADMIN_EMAIL || 'admin@curatedreels.com',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        adminName: process.env.ADMIN_NAME || 'Admin User',
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
        youtubeApiKey: process.env.YOUTUBE_API_KEY,
        customDomain: process.env.CUSTOM_DOMAIN,
    }
}

async function showWelcome() {
    console.log(chalk.cyan.bold('\n🎯 CuratedReels Deployment CLI'))
    console.log(chalk.gray(`   Version ${VERSION}\n`))
    console.log(chalk.white('   Deploy CuratedReels to your infrastructure'))
    console.log(chalk.gray('   - Vercel (Frontend + CMS)'))
    console.log(chalk.gray('   - Deno Deploy (Bot)'))
    console.log(chalk.gray('   - MongoDB Atlas (Database)\n'))
}

async function verifyLicenseKey(): Promise<string> {
    let licenseKey: string

    if (isEnvMode && process.env.LICENSE_KEY) {
        licenseKey = process.env.LICENSE_KEY
    } else {
        const response = await prompts({
            type: 'password',
            name: 'licenseKey',
            message: 'Enter your CuratedReels license key:',
            validate: (value) => value.length > 10 || 'License key is too short'
        })
        licenseKey = response.licenseKey
    }

    if (!licenseKey) {
        console.log(chalk.red('\n❌ License key is required'))
        process.exit(1)
    }

    const spinner = ora('Verifying license...').start()

    try {
        // Use mock verification in development
        const verify = process.env.NODE_ENV === 'development' ? mockVerifyLicense : verifyLicense
        const isValid = await verify(licenseKey)

        if (!isValid) {
            spinner.fail('Invalid license key')
            console.log(chalk.yellow('\n💡 Purchase a license at: https://curatedreels.com/pricing'))
            process.exit(1)
        }

        spinner.succeed('License verified')
        return licenseKey
    } catch (error) {
        spinner.fail('License verification failed')
        console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
    }
}

async function confirmDeployment() {
    if (isEnvMode) {
        // Skip confirmation in env mode
        return
    }

    const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Ready to deploy CuratedReels to your infrastructure?',
        initial: true
    })

    if (!confirm) {
        console.log(chalk.yellow('\n⏸️  Deployment cancelled'))
        process.exit(0)
    }
}

async function main() {
    try {
        await showWelcome()

        // Step 1: Verify license
        console.log(chalk.bold('\n📝 Step 1: License Verification'))
        const licenseKey = await verifyLicenseKey()

        // Step 2: Collect credentials
        console.log(chalk.bold('\n🔐 Step 2: Infrastructure Credentials'))
        let credentials: DeploymentCredentials

        if (isEnvMode) {
            const envCreds = getEnvCredentials()
            if (!envCreds) {
                console.log(chalk.red('\n❌ Missing required environment variables'))
                console.log(chalk.gray('Required: PROJECT_NAME, VERCEL_TOKEN, DENO_TOKEN, MONGODB_URI, TELEGRAM_BOT_TOKEN'))
                process.exit(1)
            }
            credentials = envCreds
            console.log(chalk.green('✔ Using credentials from environment variables'))
        } else {
            credentials = await collectCredentials()
        }

        // Step 3: Download bundles
        console.log(chalk.bold('\n📦 Step 3: Downloading Deployment Bundles'))
        // Use mock bundles only if explicitly set, otherwise download real bundles
        const useMockBundles = process.env.MOCK_BUNDLES === 'true'
        let manifest: BundleManifest | { architecture: 'legacy' }
        if (useMockBundles) {
            await mockDownloadBundles(licenseKey)
            manifest = { architecture: 'legacy' } // Mock always uses legacy
        } else {
            manifest = await downloadBundles(licenseKey)
        }

        // Step 4: Confirm deployment
        await confirmDeployment()

        // Step 5: Deploy
        console.log(chalk.bold('\n🚀 Step 4: Deploying to Your Infrastructure\n'))
        const orchestrator = new DeploymentOrchestrator(credentials, licenseKey, manifest)
        await orchestrator.deploy()

        // Success!
        console.log(chalk.green.bold('\n✅ Deployment Complete!\n'))
        console.log(chalk.white('Your CuratedReels instance is live:\n'))
        
        if (manifest.architecture === 'unified') {
            // Unified architecture: Single URL for everything
            console.log(chalk.cyan(`  📱 App:      ${orchestrator.appUrl}`))
            console.log(chalk.cyan(`  ⚙️  Admin:    ${orchestrator.appUrl}/admin`))
            console.log(chalk.cyan(`  🤖 Bot:      ${orchestrator.botUrl}\n`))
        } else {
            // Legacy architecture: Separate URLs
            console.log(chalk.cyan(`  📱 Frontend: ${orchestrator.frontendUrl}`))
            console.log(chalk.cyan(`  ⚙️  Admin:    ${orchestrator.cmsUrl}/admin`))
            console.log(chalk.cyan(`  🤖 Bot:      ${orchestrator.botUrl}\n`))
        }

        // Generate webhook setup URL
        const webhookSetupUrl = `https://api.telegram.org/bot${credentials.telegramBotToken}/setWebhook?url=${orchestrator.botUrl}/webhook`
        
        console.log(chalk.yellow.bold('⚠️  IMPORTANT: Set up Telegram Webhook\n'))
        console.log(chalk.white('Click this link to activate your bot:\n'))
        console.log(chalk.cyan(`  ${webhookSetupUrl}\n`))
        console.log(chalk.gray('This tells Telegram where to send messages for your bot.\n'))

        // Call setup endpoint to create admin user (with retries and wait)
        console.log(chalk.white('🔧 Setting up admin user...'))
        console.log(chalk.gray('   Waiting for CMS to be ready...\n'))
        
        // Use the appropriate URL based on architecture
        const appBaseUrl = manifest.architecture === 'unified' ? orchestrator.appUrl : orchestrator.cmsUrl
        
        let setupSuccess = false
        const maxRetries = 10
        const retryDelay = 10000 // 10 seconds
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // First check if CMS is responding
                const healthCheck = await fetch(`${appBaseUrl}/api/health`, { 
                    method: 'GET',
                    signal: AbortSignal.timeout(8000)
                }).catch(() => null)
                
                if (!healthCheck?.ok) {
                    if (attempt < maxRetries) {
                        console.log(chalk.gray(`   Attempt ${attempt}/${maxRetries}: CMS not ready yet, waiting...`))
                        await new Promise(resolve => setTimeout(resolve, retryDelay))
                        continue
                    }
                }
                
                // Try to create admin user
                const setupResponse = await fetch(`${appBaseUrl}/api/setup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(15000)
                })
                console.log('🚀 :: main :: setupResponse:', setupResponse)
                const setupResult = await setupResponse.json() as any
                
                if (setupResponse.ok) {
                    console.log(chalk.green(`✔ Admin user created successfully`))
                    console.log(chalk.gray(`  Email: ${credentials.adminEmail}`))
                    console.log(chalk.gray(`  Password: ${credentials.adminPassword}\n`))
                    console.log(chalk.yellow.bold('⚠️  IMPORTANT: Change your password after first login!\n'))
                    setupSuccess = true
                    break
                } else if (setupResult.message?.includes('already exists')) {
                    console.log(chalk.yellow('⚠️  Admin user already exists'))
                    console.log(chalk.gray(`  Login with: ${credentials.adminEmail}\n`))
                    setupSuccess = true
                    break
                } else if (attempt < maxRetries) {
                    console.log(chalk.gray(`   Attempt ${attempt}/${maxRetries}: ${setupResult.message || 'Failed'}, retrying...`))
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                } else {
                    console.log(chalk.yellow(`⚠️  Could not create admin user: ${setupResult.message}`))
                    console.log(chalk.gray(`  Login with: ${credentials.adminEmail}\n`))
                }
            } catch (error: any) {
                if (attempt < maxRetries) {
                    console.log(chalk.gray(`   Attempt ${attempt}/${maxRetries}: ${error.message}, retrying...`))
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                } else {
                    console.log(chalk.yellow(`⚠️  Could not auto-create admin user: ${error.message}`))
                    console.log(chalk.cyan(`\n   Manual setup: POST ${appBaseUrl}/api/setup\n`))
                }
            }
        }

        console.log(chalk.white('Next steps:'))
        console.log(chalk.gray('  1. Click the webhook URL above (should show "ok":true)'))
        console.log(chalk.gray('  2. Configure bot environment variables if needed (see instructions above)'))
        console.log(chalk.gray('  3. Login to admin panel and create your first user'))
        console.log(chalk.gray('  4. Add your Telegram bot to a group to start curating\n'))

        console.log(chalk.white('Resources:'))
        console.log(chalk.gray('  💬 Support: support@whatsnxt.in\n'))

    } catch (error) {
        console.error(chalk.red(`\n❌ Deployment failed:`))
        console.error(chalk.red(`   ${error instanceof Error ? error.message : String(error)}\n`))

        console.log(chalk.yellow('💡 Need help? Contact support@whatsnxt.in\n'))
        process.exit(1)
    }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⏸️  Deployment interrupted'))
    process.exit(0)
})

main()
