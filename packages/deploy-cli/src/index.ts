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
import { downloadBundles, mockDownloadBundles } from './services/bundles.js'

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
        const download = useMockBundles ? mockDownloadBundles : downloadBundles
        await download(licenseKey)

        // Step 4: Confirm deployment
        await confirmDeployment()

        // Step 5: Deploy
        console.log(chalk.bold('\n🚀 Step 4: Deploying to Your Infrastructure\n'))
        const orchestrator = new DeploymentOrchestrator(credentials, licenseKey)
        await orchestrator.deploy()

        // Success!
        console.log(chalk.green.bold('\n✅ Deployment Complete!\n'))
        console.log(chalk.white('Your CuratedReels instance is live:\n'))
        console.log(chalk.cyan(`  📱 Frontend: ${orchestrator.frontendUrl}`))
        console.log(chalk.cyan(`  ⚙️  Admin:    ${orchestrator.cmsUrl}/admin`))
        console.log(chalk.cyan(`  🤖 Bot:      ${orchestrator.botUrl}\n`))

        console.log(chalk.white('Next steps:'))
        console.log(chalk.gray('  1. Add bot to Telegram: t.me/YourBotName'))
        console.log(chalk.gray('  2. Login to admin panel'))
        console.log(chalk.gray('  3. Configure your groups\n'))

        console.log(chalk.white('Resources:'))
        console.log(chalk.gray('  📚 Documentation: https://docs.curatedreels.com'))
        console.log(chalk.gray('  💬 Support: support@curatedreels.com\n'))

    } catch (error) {
        console.error(chalk.red(`\n❌ Deployment failed:`))
        console.error(chalk.red(`   ${error instanceof Error ? error.message : String(error)}\n`))

        console.log(chalk.yellow('💡 Need help? Contact support@curatedreels.com\n'))
        process.exit(1)
    }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⏸️  Deployment interrupted'))
    process.exit(0)
})

main()
