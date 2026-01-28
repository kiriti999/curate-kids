#!/usr/bin/env node

/**
 * CuratedReels Admin CLI
 * 
 * License management tool for CuratedReels white-label deployments
 */

import { program } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env from admin-cli directory
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPaths = [
    process.env.DOTENV_CONFIG_PATH,
    resolve(__dirname, '../.env'),           // When running from src/
    resolve(__dirname, '../../.env'),         // When running from admin-cli/src/
    resolve(process.cwd(), 'packages/admin-cli/.env'),  // When running from root
    resolve(process.cwd(), '.env'),           // Fallback to cwd
].filter(Boolean) as string[]

for (const envPath of envPaths) {
    if (existsSync(envPath)) {
        // console.log(`[DEBUG] Loading env from: ${envPath}`)
        config({ path: envPath })
        break
    }
}

import {
    createLicense,
    getLicense,
    listLicenses,
    revokeLicense,
    listDeployments,
    getStats,
    verifyLicense,
    disconnect
} from './services/license.js'

program
    .name('curatedreels-admin')
    .description('Admin CLI for CuratedReels license management')
    .version('1.0.0')

// ============ LICENSE COMMANDS ============

program
    .command('create')
    .description('Create a new license')
    .requiredOption('-n, --name <name>', 'Customer name')
    .requiredOption('-e, --email <email>', 'Customer email')
    .option('-t, --tier <tier>', 'License tier (starter, pro, enterprise)', 'starter')
    .option('--expires <days>', 'Expires in N days (default: never)')
    .option('--test', 'Create a test license')
    .action(async (options) => {
        const spinner = ora('Creating license...').start()

        try {
            const license = await createLicense({
                customerName: options.name,
                customerEmail: options.email,
                tier: options.tier,
                expiresInDays: options.expires ? parseInt(options.expires) : undefined,
                isTest: options.test
            })

            spinner.succeed('License created!')

            console.log('')
            console.log(chalk.bold('License Details:'))
            console.log(chalk.gray('─'.repeat(50)))
            console.log(`${chalk.cyan('Key:')}          ${chalk.green(license.key)}`)
            console.log(`${chalk.cyan('Customer ID:')}  ${license.customerId}`)
            console.log(`${chalk.cyan('Name:')}         ${license.customerName}`)
            console.log(`${chalk.cyan('Email:')}        ${license.customerEmail}`)
            console.log(`${chalk.cyan('Tier:')}         ${license.tier}`)
            console.log(`${chalk.cyan('Max Deploys:')}  ${license.maxDeployments}`)
            console.log(`${chalk.cyan('Expires:')}      ${license.expiresAt ? license.expiresAt.toISOString() : 'Never'}`)
            console.log('')
            console.log(chalk.yellow('⚠️  Save this license key securely. It cannot be recovered.'))

        } catch (error) {
            spinner.fail('Failed to create license')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

program
    .command('list')
    .description('List all licenses')
    .option('-s, --status <status>', 'Filter by status (active, expired, suspended)')
    .option('-t, --tier <tier>', 'Filter by tier (starter, pro, enterprise)')
    .action(async (options) => {
        const spinner = ora('Fetching licenses...').start()

        try {
            const licenses = await listLicenses({
                status: options.status,
                tier: options.tier
            })

            spinner.stop()

            if (licenses.length === 0) {
                console.log(chalk.yellow('No licenses found'))
                return
            }

            console.log('')
            console.log(chalk.bold(`Found ${licenses.length} license(s):`))
            console.log(chalk.gray('─'.repeat(100)))
            console.log(
                chalk.gray(
                    'Key'.padEnd(45) +
                    'Customer'.padEnd(20) +
                    'Tier'.padEnd(12) +
                    'Status'.padEnd(12) +
                    'Created'
                )
            )
            console.log(chalk.gray('─'.repeat(100)))

            for (const license of licenses) {
                const statusColor = {
                    active: chalk.green,
                    expired: chalk.yellow,
                    suspended: chalk.red
                }[license.status]

                console.log(
                    license.key.slice(0, 42).padEnd(45) +
                    license.customerName.slice(0, 18).padEnd(20) +
                    license.tier.padEnd(12) +
                    statusColor(license.status.padEnd(12)) +
                    license.createdAt.toISOString().slice(0, 10)
                )
            }
            console.log('')

        } catch (error) {
            spinner.fail('Failed to list licenses')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

program
    .command('info <key>')
    .description('Get license details')
    .action(async (key) => {
        const spinner = ora('Fetching license...').start()

        try {
            const result = await verifyLicense(key)

            if (!result.valid) {
                spinner.fail(result.error || 'License not found')
                process.exit(1)
            }

            const license = result.license!
            const deployments = await listDeployments(key)

            spinner.succeed('License found')

            console.log('')
            console.log(chalk.bold('License Details:'))
            console.log(chalk.gray('─'.repeat(50)))
            console.log(`${chalk.cyan('Key:')}           ${license.key}`)
            console.log(`${chalk.cyan('Customer ID:')}   ${license.customerId}`)
            console.log(`${chalk.cyan('Name:')}          ${license.customerName}`)
            console.log(`${chalk.cyan('Email:')}         ${license.customerEmail}`)
            console.log(`${chalk.cyan('Tier:')}          ${license.tier}`)
            console.log(`${chalk.cyan('Status:')}        ${license.status}`)
            console.log(`${chalk.cyan('Max Deploys:')}   ${license.maxDeployments}`)
            console.log(`${chalk.cyan('Used Deploys:')}  ${result.currentDeployments}`)
            console.log(`${chalk.cyan('Created:')}       ${license.createdAt.toISOString()}`)
            console.log(`${chalk.cyan('Expires:')}       ${license.expiresAt ? license.expiresAt.toISOString() : 'Never'}`)

            if (deployments.length > 0) {
                console.log('')
                console.log(chalk.bold('Deployments:'))
                console.log(chalk.gray('─'.repeat(50)))
                for (const d of deployments) {
                    console.log(`  ${chalk.cyan(d.projectName)}`)
                    console.log(`    Frontend: ${d.frontendUrl}`)
                    console.log(`    CMS:      ${d.cmsUrl}`)
                    console.log(`    Bot:      ${d.botUrl}`)
                    console.log(`    Deployed: ${d.deployedAt.toISOString().slice(0, 10)}`)
                    console.log('')
                }
            }

        } catch (error) {
            spinner.fail('Failed to get license')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

program
    .command('revoke <key>')
    .description('Revoke a license')
    .action(async (key) => {
        const spinner = ora('Revoking license...').start()

        try {
            const success = await revokeLicense(key)

            if (success) {
                spinner.succeed('License revoked')
            } else {
                spinner.fail('License not found')
                process.exit(1)
            }

        } catch (error) {
            spinner.fail('Failed to revoke license')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

// ============ DEPLOYMENT COMMANDS ============

program
    .command('deployments')
    .description('List all deployments')
    .option('-l, --license <key>', 'Filter by license key')
    .action(async (options) => {
        const spinner = ora('Fetching deployments...').start()

        try {
            const deployments = await listDeployments(options.license)

            spinner.stop()

            if (deployments.length === 0) {
                console.log(chalk.yellow('No deployments found'))
                return
            }

            console.log('')
            console.log(chalk.bold(`Found ${deployments.length} deployment(s):`))
            console.log(chalk.gray('─'.repeat(100)))

            for (const d of deployments) {
                console.log(chalk.cyan.bold(d.projectName))
                console.log(`  License:  ${d.licenseKey.slice(0, 20)}...`)
                console.log(`  Frontend: ${d.frontendUrl}`)
                console.log(`  CMS:      ${d.cmsUrl}`)
                console.log(`  Bot:      ${d.botUrl}`)
                console.log(`  Deployed: ${d.deployedAt.toISOString()}`)
                console.log(`  Status:   ${d.status}`)
                console.log('')
            }

        } catch (error) {
            spinner.fail('Failed to list deployments')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

// ============ STATS COMMAND ============

program
    .command('stats')
    .description('Show license statistics')
    .action(async () => {
        const spinner = ora('Fetching stats...').start()

        try {
            const stats = await getStats()

            spinner.stop()

            console.log('')
            console.log(chalk.bold('📊 License Statistics'))
            console.log(chalk.gray('─'.repeat(40)))
            console.log(`${chalk.cyan('Total Licenses:')}     ${stats.totalLicenses}`)
            console.log(`${chalk.cyan('Active Licenses:')}    ${stats.activeLicenses}`)
            console.log(`${chalk.cyan('Total Deployments:')}  ${stats.totalDeployments}`)
            console.log('')
            console.log(chalk.bold('By Tier:'))
            console.log(`  Starter:    ${stats.byTier.starter || 0}`)
            console.log(`  Pro:        ${stats.byTier.pro || 0}`)
            console.log(`  Enterprise: ${stats.byTier.enterprise || 0}`)
            console.log('')

        } catch (error) {
            spinner.fail('Failed to get stats')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

// ============ VERIFY COMMAND (for testing) ============

program
    .command('verify <key>')
    .description('Verify a license key (for testing)')
    .action(async (key) => {
        const spinner = ora('Verifying license...').start()

        try {
            const result = await verifyLicense(key)

            if (result.valid) {
                spinner.succeed('License is valid')
                console.log(`  Tier: ${result.license!.tier}`)
                console.log(`  Deployments: ${result.currentDeployments}/${result.license!.maxDeployments}`)
            } else {
                spinner.fail(`Invalid: ${result.error}`)
                process.exit(1)
            }

        } catch (error) {
            spinner.fail('Verification failed')
            console.error(chalk.red(error instanceof Error ? error.message : String(error)))
            process.exit(1)
        } finally {
            await disconnect()
        }
    })

program.parse()
