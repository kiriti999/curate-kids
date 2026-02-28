/**
 * Deployment Orchestrator
 * 
 * Coordinates deployment to all customer infrastructure:
 * - Vercel (Frontend + CMS)
 * - Deno Deploy (Bot)
 * - MongoDB Atlas (Database)
 */

import ora from 'ora'
import chalk from 'chalk'
import type { DeploymentCredentials } from './utils/credentials.js'
import { VercelClient } from './clients/vercel.js'
import { DenoClient } from './clients/deno.js'
import { setupMongoDB } from './services/mongodb.js'
import { registerDeployment } from './services/license.js'
import { getBundlesDir, type BundleManifest } from './services/bundles.js'

export class DeploymentOrchestrator {
    private vercel: VercelClient
    private deno: DenoClient

    public appUrl: string = ''
    public botUrl: string = ''

    // Track deployed resources for rollback
    private deployedResources: {
        app?: string
        bot?: string
    } = {}

    // Track manual setup instructions
    private manualSetupRequired: {
        settingsUrl?: string
        envVars?: Record<string, string>
    } | null = null

    constructor(
        private credentials: DeploymentCredentials,
        private licenseKey: string
    ) {
        this.vercel = new VercelClient(credentials.vercelToken, credentials.vercelTeamId)
        this.deno = new DenoClient(credentials.denoToken, credentials.denoOrg)
    }

    /**
     * Main deployment flow
     */
    async deploy(): Promise<void> {
        const startTime = Date.now()

        try {
            // Step 1: Setup MongoDB
            await this.deployMongoDB()

            // Step 2: Deploy unified app to Vercel (Frontend + CMS)
            await this.deployApp()

            // Step 3: Deploy Bot
            await this.deployBot()

            // Step 4: Register deployment with license server
            await this.registerDeployment()

            // Success metrics
            const duration = Math.round((Date.now() - startTime) / 1000)
            console.log(chalk.gray(`\n⏱️  Total deployment time: ${duration}s\n`))

            // Display manual setup instructions if needed
            if (this.manualSetupRequired) {
                console.log(chalk.yellow('\n📋 Post-Deployment Setup Required:\n'))
                console.log(`The bot has been deployed successfully, but requires environment variable configuration.`)
                console.log(`\nPlease configure the following environment variables in the Deno Deploy dashboard:\n`)
                console.log(chalk.cyan(`   ${this.manualSetupRequired.settingsUrl}\n`))
                console.log(chalk.gray('Environment variables to configure:\n'))

                for (const [key, value] of Object.entries(this.manualSetupRequired.envVars || {})) {
                    console.log(chalk.gray(`   ${key}=${value}`))
                }

                console.log(chalk.yellow(`\n⚠️  After setting environment variables, the bot will automatically redeploy and start working.\n`))
                console.log(chalk.gray(`💡 Tip: You can visit ${this.botUrl} to check if env vars are configured.\n`))
            }

        } catch (error) {
            console.error(chalk.red('\n❌ Deployment failed\n'))

            // Rollback deployed resources
            await this.rollback()

            throw error
        }
    }

    /**
     * Rollback deployed resources on failure
     */
    private async rollback(): Promise<void> {
        console.log(chalk.yellow('\n🔄 Rolling back deployed resources...\n'))

        const rollbackSpinner = ora('Cleaning up...').start()

        try {
            // Delete Vercel project
            if (this.deployedResources.app) {
                rollbackSpinner.text = `Deleting app project: ${this.deployedResources.app}...`
                await this.vercel.deleteProject(this.deployedResources.app).catch(() => { })
            }

            // Delete Deno Deploy project
            if (this.deployedResources.bot) {
                rollbackSpinner.text = `Deleting Bot project: ${this.deployedResources.bot}...`
                await this.deno.deleteProject(this.deployedResources.bot).catch(() => { })
            }

            rollbackSpinner.succeed('Cleanup completed')
        } catch (error) {
            rollbackSpinner.warn('Some resources may need manual cleanup')
        }
    }

    /**
     * Deploy MongoDB and configure
     */
    private async deployMongoDB(): Promise<void> {
        const spinner = ora('Setting up MongoDB...').start()

        try {
            await setupMongoDB(this.credentials.mongodbUri)
            spinner.succeed('MongoDB configured')
        } catch (error) {
            spinner.fail('MongoDB setup failed')
            throw new Error(`MongoDB: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Deploy unified App to Vercel (Frontend + CMS in one)
     */
    private async deployApp(): Promise<void> {
        const spinner = ora('Deploying unified app to Vercel...').start()

        try {
            const projectName = this.credentials.projectName
            this.deployedResources.app = projectName

            const bundlePath = `${getBundlesDir()}/app`

            // Generate a random secret for Payload CMS
            const payloadSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0')).join('')

            const envVars = {
                MONGODB_URI: this.credentials.mongodbUri,
                PAYLOAD_SECRET: payloadSecret,
                TELEGRAM_BOT_TOKEN: this.credentials.telegramBotToken,
                ADMIN_EMAIL: this.credentials.adminEmail,
                ADMIN_PASSWORD: this.credentials.adminPassword,
                ADMIN_NAME: this.credentials.adminName || 'Admin User',
                // Email Configuration
                SMTP_HOST: 'smtpout.secureserver.net',
                SMTP_PORT: '465',
                SMTP_SECURE: 'true',
                SMTP_USER: 'support@whatsnxt.in',
                SMTP_PASS: 'Secure@123',
                SMTP_FROM_EMAIL: 'support@whatsnxt.in',
                SMTP_FROM_NAME: 'WhatsNxt Support',
                // Unified app: All URLs point to same domain
                NEXT_PUBLIC_FRONTEND_URL: '', // Will be set to deployment URL after deploy
                PAYLOAD_PUBLIC_SERVER_URL: '', // Will be set to deployment URL after deploy
                NEXT_PUBLIC_PAYLOAD_API_URL: '', // Will be set to deployment URL/api after deploy
                ...(this.credentials.telegramGroupId && {
                    TELEGRAM_GROUP: this.credentials.telegramGroupId
                }),
                ...(this.credentials.cloudinaryCloudName && {
                    CLOUDINARY_CLOUD_NAME: this.credentials.cloudinaryCloudName,
                    CLOUDINARY_API_KEY: this.credentials.cloudinaryApiKey!,
                    CLOUDINARY_API_SECRET: this.credentials.cloudinaryApiSecret!,
                }),
                ...(this.credentials.youtubeApiKey && {
                    YOUTUBE_API_KEY: this.credentials.youtubeApiKey
                }),
                NODE_ENV: 'production',
            }

            this.appUrl = await this.vercel.deploy({
                projectName,
                bundlePath,
                envVars,
                framework: 'nextjs'
            })

            // Update environment variables with the actual deployment URL
            await this.vercel.updateEnvironmentVariables(projectName, {
                NEXT_PUBLIC_FRONTEND_URL: this.appUrl,
                PAYLOAD_PUBLIC_SERVER_URL: this.appUrl,
                NEXT_PUBLIC_PAYLOAD_API_URL: `${this.appUrl}/api`,
                NEXT_PUBLIC_REQUIRE_LOGIN: 'true',
            })

            spinner.succeed(`Unified app deployed: ${chalk.cyan(this.appUrl)}`)
        } catch (error) {
            spinner.fail('Unified app deployment failed')
            throw new Error(`Vercel App: ${error instanceof Error ? error.message : String(error)}`)
        }
    }


    /**
     * Deploy Bot to Deno Deploy
     */
    private async deployBot(): Promise<void> {
        const spinner = ora('Deploying Bot to Deno Deploy...').start()

        try {
            const projectName = `${this.credentials.projectName}-bot`
            this.deployedResources.bot = projectName

            const botDir = `${getBundlesDir()}/bot`

            const envVars = {
                TELEGRAM_BOT_TOKEN: this.credentials.telegramBotToken,
                MONGODB_URI: this.credentials.mongodbUri,
                CMS_URL: this.appUrl,
                PAYLOAD_CMS_URL: this.appUrl,
                FRONTEND_URL: this.appUrl,
                WEBHOOK_URL: `https://${projectName}.deno.dev/webhook`,
                ...(this.credentials.telegramGroupId && {
                    TELEGRAM_GROUP: this.credentials.telegramGroupId
                }),
                ...(this.credentials.cloudinaryCloudName && {
                    CLOUDINARY_CLOUD_NAME: this.credentials.cloudinaryCloudName,
                    CLOUDINARY_API_KEY: this.credentials.cloudinaryApiKey!,
                    CLOUDINARY_API_SECRET: this.credentials.cloudinaryApiSecret!,
                }),
                ...(this.credentials.youtubeApiKey && {
                    YOUTUBE_API_KEY: this.credentials.youtubeApiKey
                }),
            }

            const result = await this.deno.deploy({
                projectName,
                entrypoint: botDir,
                envVars
            })

            this.botUrl = result.url

            // Store manual setup instructions for display after deployment
            this.manualSetupRequired = {
                settingsUrl: result.settingsUrl,
                envVars: result.envVarsToSet
            }

            spinner.succeed(`Bot deployed: ${chalk.cyan(this.botUrl)}`)
        } catch (error) {
            spinner.fail('Bot deployment failed')
            throw new Error(`Deno Deploy: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Register deployment with license server
     */
    private async registerDeployment(): Promise<void> {
        const spinner = ora('Registering deployment...').start()

        try {
            await registerDeployment(this.licenseKey, {
                projectName: this.credentials.projectName,
                frontendUrl: this.appUrl,
                cmsUrl: this.appUrl,
                botUrl: this.botUrl
            })

            spinner.succeed('Deployment registered')
        } catch (error) {
            spinner.warn('Failed to register deployment (non-critical)')
            // Don't fail deployment if registration fails
        }
    }
}
