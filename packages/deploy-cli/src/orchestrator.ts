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
import { getBundlesDir } from './services/bundles.js'

export class DeploymentOrchestrator {
    private vercel: VercelClient
    private deno: DenoClient

    public frontendUrl: string = ''
    public cmsUrl: string = ''
    public botUrl: string = ''
    
    // Track deployed resources for rollback
    private deployedResources: {
        cms?: string
        frontend?: string
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

            // Step 2: Deploy CMS (needs to be first so frontend can reference its URL)
            await this.deployCMS()

            // Step 3: Deploy Frontend
            await this.deployFrontend()

            // Step 4: Deploy Bot
            await this.deployBot()

            // Step 5: Register deployment with license server
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
            // Delete Vercel projects
            if (this.deployedResources.cms) {
                rollbackSpinner.text = `Deleting CMS project: ${this.deployedResources.cms}...`
                await this.vercel.deleteProject(this.deployedResources.cms).catch(() => {})
            }

            if (this.deployedResources.frontend) {
                rollbackSpinner.text = `Deleting Frontend project: ${this.deployedResources.frontend}...`
                await this.vercel.deleteProject(this.deployedResources.frontend).catch(() => {})
            }

            // Delete Deno Deploy project
            if (this.deployedResources.bot) {
                rollbackSpinner.text = `Deleting Bot project: ${this.deployedResources.bot}...`
                await this.deno.deleteProject(this.deployedResources.bot).catch(() => {})
            }

            rollbackSpinner.succeed('Cleanup completed')
        } catch (error) {
            rollbackSpinner.warn('Some resources may need manual cleanup')
        }
    }

    /**
     * Deploy and configure MongoDB
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
     * Deploy CMS to Vercel
     */
    private async deployCMS(): Promise<void> {
        const spinner = ora('Deploying CMS to Vercel...').start()

        try {
            const projectName = `${this.credentials.projectName}-cms`
            this.deployedResources.cms = projectName

            const bundlePath = `${getBundlesDir()}/cms`

            // Generate a random secret for Payload CMS
            const payloadSecret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0')).join('')

            const envVars = {
                MONGODB_URI: this.credentials.mongodbUri,
                PAYLOAD_SECRET: payloadSecret,
                TELEGRAM_BOT_TOKEN: this.credentials.telegramBotToken,
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

            this.cmsUrl = await this.vercel.deploy({
                projectName,
                bundlePath,
                envVars,
                framework: 'nextjs'
            })

            spinner.succeed(`CMS deployed: ${chalk.cyan(this.cmsUrl)}`)
        } catch (error) {
            spinner.fail('CMS deployment failed')
            throw new Error(`Vercel CMS: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    /**
     * Deploy Frontend to Vercel
     */
    private async deployFrontend(): Promise<void> {
        const spinner = ora('Deploying Frontend to Vercel...').start()

        try {
            const projectName = `${this.credentials.projectName}-frontend`
            this.deployedResources.frontend = projectName
            
            const bundlePath = `${getBundlesDir()}/frontend`

            const envVars = {
                NEXT_PUBLIC_PAYLOAD_API_URL: `${this.cmsUrl}/api`,
            }

            this.frontendUrl = await this.vercel.deploy({
                projectName,
                bundlePath,
                envVars,
                framework: 'nextjs'
            })

            // Update CMS with frontend URL
            spinner.text = 'Linking frontend to CMS...'
            await this.vercel.updateEnvironmentVariables(
                `${this.credentials.projectName}-cms`,
                { NEXT_PUBLIC_FRONTEND_URL: this.frontendUrl }
            )

            // Add custom domain if specified
            if (this.credentials.customDomain) {
                spinner.text = 'Adding custom domain...'
                await this.vercel.addDomain(projectName, this.credentials.customDomain)
                this.frontendUrl = `https://${this.credentials.customDomain}`
            }

            spinner.succeed(`Frontend deployed: ${chalk.cyan(this.frontendUrl)}`)
        } catch (error) {
            spinner.fail('Frontend deployment failed')
            throw new Error(`Vercel Frontend: ${error instanceof Error ? error.message : String(error)}`)
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
                PAYLOAD_CMS_URL: this.cmsUrl,
                FRONTEND_URL: this.frontendUrl,
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
                frontendUrl: this.frontendUrl,
                cmsUrl: this.cmsUrl,
                botUrl: this.botUrl
            })

            spinner.succeed('Deployment registered')
        } catch (error) {
            spinner.warn('Failed to register deployment (non-critical)')
            // Don't fail deployment if registration fails
        }
    }
}
