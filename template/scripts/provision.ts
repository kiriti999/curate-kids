#!/usr/bin/env node
/**
 * CuratedReels Template - Provisioning Script
 * 
 * This script orchestrates the complete setup for a new customer:
 * 1. Collects credentials (interactive prompts)
 * 2. Validates all connections
 * 3. Sets up MongoDB (collections, indexes, admin user)
 * 4. Runs Terraform (Vercel + Deno Deploy)
 * 5. Deploys code
 * 6. Outputs credentials
 * 
 * Usage: npm run provision
 */

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { MongoClient } from 'mongodb';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface CustomerConfig {
    customerName: string;
    adminEmail: string;
    mongoUri: string;
    vercelToken: string;
    denoToken: string;
    telegramBotToken: string;
    cloudinaryCloudName: string;
    cloudinaryApiKey: string;
    cloudinaryApiSecret: string;
    youtubeApiKey?: string;
    customDomain?: string;
}

interface ProvisionResult {
    frontendUrl: string;
    botUsername: string;
    adminEmail: string;
    tempPassword: string;
}

// ============================================================================
// STEP 1: COLLECT INPUTS
// ============================================================================

async function collectInputs(): Promise<CustomerConfig> {
    console.log(chalk.blue.bold('\n🚀 CuratedReels Customer Provisioning\n'));
    console.log(chalk.gray('Please provide the following credentials:\n'));

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'customerName',
            message: 'Customer/Brand Name:',
            validate: (input: string) => input.length > 0 || 'Required',
        },
        {
            type: 'input',
            name: 'adminEmail',
            message: 'Admin Email:',
            validate: (input: string) => input.includes('@') || 'Invalid email',
        },
        {
            type: 'password',
            name: 'mongoUri',
            message: 'MongoDB Connection URI:',
            validate: (input: string) => input.startsWith('mongodb') || 'Must be a MongoDB URI',
        },
        {
            type: 'password',
            name: 'vercelToken',
            message: 'Vercel Access Token:',
            validate: (input: string) => input.length > 10 || 'Invalid token',
        },
        {
            type: 'password',
            name: 'denoToken',
            message: 'Deno Deploy Access Token:',
            validate: (input: string) => input.length > 10 || 'Invalid token',
        },
        {
            type: 'password',
            name: 'telegramBotToken',
            message: 'Telegram Bot Token:',
            validate: (input: string) => input.includes(':') || 'Invalid bot token',
        },
        {
            type: 'input',
            name: 'cloudinaryCloudName',
            message: 'Cloudinary Cloud Name:',
            validate: (input: string) => input.length > 0 || 'Required',
        },
        {
            type: 'password',
            name: 'cloudinaryApiKey',
            message: 'Cloudinary API Key:',
            validate: (input: string) => input.length > 0 || 'Required',
        },
        {
            type: 'password',
            name: 'cloudinaryApiSecret',
            message: 'Cloudinary API Secret:',
            validate: (input: string) => input.length > 0 || 'Required',
        },
        {
            type: 'input',
            name: 'youtubeApiKey',
            message: 'YouTube API Key (optional):',
        },
        {
            type: 'input',
            name: 'customDomain',
            message: 'Custom Domain (optional, e.g., curatedreels.com):',
        },
    ]);

    return answers as CustomerConfig;
}

// ============================================================================
// STEP 2: VALIDATE CONNECTIONS
// ============================================================================

async function validateConnections(config: CustomerConfig): Promise<boolean> {
    console.log(chalk.blue.bold('\n🔍 Validating Connections...\n'));

    // Validate MongoDB
    const mongoSpinner = ora('Testing MongoDB connection...').start();
    try {
        const client = new MongoClient(config.mongoUri);
        await client.connect();
        await client.db().command({ ping: 1 });
        await client.close();
        mongoSpinner.succeed('MongoDB connection valid');
    } catch (error) {
        mongoSpinner.fail('MongoDB connection failed');
        console.error(chalk.red(`  Error: ${(error as Error).message}`));
        return false;
    }

    // Validate Vercel Token
    const vercelSpinner = ora('Testing Vercel token...').start();
    try {
        const response = await fetch('https://api.vercel.com/v2/user', {
            headers: { Authorization: `Bearer ${config.vercelToken}` },
        });
        if (!response.ok) throw new Error('Invalid token');
        vercelSpinner.succeed('Vercel token valid');
    } catch {
        vercelSpinner.fail('Vercel token invalid');
        return false;
    }

    // Validate Deno Token
    const denoSpinner = ora('Testing Deno Deploy token...').start();
    try {
        const response = await fetch('https://api.deno.com/v1/organizations', {
            headers: { Authorization: `Bearer ${config.denoToken}` },
        });
        if (!response.ok) throw new Error('Invalid token');
        denoSpinner.succeed('Deno Deploy token valid');
    } catch {
        denoSpinner.fail('Deno Deploy token invalid');
        return false;
    }

    // Validate Telegram Bot Token
    const telegramSpinner = ora('Testing Telegram bot token...').start();
    try {
        const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getMe`);
        const data = await response.json();
        if (!data.ok) throw new Error('Invalid token');
        telegramSpinner.succeed(`Telegram bot valid: @${data.result.username}`);
    } catch {
        telegramSpinner.fail('Telegram bot token invalid');
        return false;
    }

    return true;
}

// ============================================================================
// STEP 3: SETUP MONGODB
// ============================================================================

async function setupMongoDB(config: CustomerConfig): Promise<void> {
    console.log(chalk.blue.bold('\n🗄️  Setting up MongoDB...\n'));

    const spinner = ora('Connecting to MongoDB...').start();
    const client = new MongoClient(config.mongoUri);

    try {
        await client.connect();
        const db = client.db();

        // Create collections
        spinner.text = 'Creating collections...';
        const collections = ['users', 'videos', 'categories', 'media'];
        for (const coll of collections) {
            try {
                await db.createCollection(coll);
            } catch {
                // Collection might already exist
            }
        }

        // Create indexes
        spinner.text = 'Creating indexes...';

        // Videos indexes
        await db.collection('videos').createIndex({ slug: 1 }, { unique: true });
        await db.collection('videos').createIndex({ category: 1 });
        await db.collection('videos').createIndex({ ageRange: 1 });
        await db.collection('videos').createIndex({ createdAt: -1 });
        await db.collection('videos').createIndex({ embeddable: 1 });

        // Users indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });

        // Create admin user
        spinner.text = 'Creating admin user...';
        const tempPassword = generateTempPassword();
        const hashedPassword = await hashPassword(tempPassword);

        await db.collection('users').updateOne(
            { email: config.adminEmail },
            {
                $set: {
                    email: config.adminEmail,
                    password: hashedPassword,
                    role: 'admin',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        spinner.succeed('MongoDB setup complete');

        // Store temp password for later output
        (config as any).tempPassword = tempPassword;

    } finally {
        await client.close();
    }
}

// ============================================================================
// STEP 4: RUN TERRAFORM
// ============================================================================

async function runTerraform(config: CustomerConfig): Promise<void> {
    console.log(chalk.blue.bold('\n🏗️  Running Terraform...\n'));

    const spinner = ora('Initializing Terraform...').start();
    const terraformDir = join(__dirname, '..', 'infra', 'terraform');

    try {
        // Write terraform.tfvars
        const tfvars = `
vercel_token = "${config.vercelToken}"
deno_token = "${config.denoToken}"
project_name = "${slugify(config.customerName)}"
mongodb_uri = "${config.mongoUri}"
telegram_bot_token = "${config.telegramBotToken}"
cloudinary_cloud_name = "${config.cloudinaryCloudName}"
cloudinary_api_key = "${config.cloudinaryApiKey}"
cloudinary_api_secret = "${config.cloudinaryApiSecret}"
youtube_api_key = "${config.youtubeApiKey || ''}"
custom_domain = "${config.customDomain || ''}"
`;
        writeFileSync(join(terraformDir, 'terraform.tfvars'), tfvars);

        // Terraform init
        spinner.text = 'Running terraform init...';
        execSync('terraform init', { cwd: terraformDir, stdio: 'pipe' });

        // Terraform plan
        spinner.text = 'Running terraform plan...';
        execSync('terraform plan -out=tfplan', { cwd: terraformDir, stdio: 'pipe' });

        // Terraform apply
        spinner.text = 'Running terraform apply...';
        execSync('terraform apply -auto-approve tfplan', { cwd: terraformDir, stdio: 'pipe' });

        spinner.succeed('Terraform complete');

    } catch (error) {
        spinner.fail('Terraform failed');
        console.error(chalk.red(`  Error: ${(error as Error).message}`));
        throw error;
    }
}

// ============================================================================
// STEP 5: DEPLOY CODE
// ============================================================================

async function deployCode(config: CustomerConfig): Promise<ProvisionResult> {
    console.log(chalk.blue.bold('\n🚀 Deploying Code...\n'));

    const projectSlug = slugify(config.customerName);

    // Deploy Frontend (Vercel)
    const frontendSpinner = ora('Deploying frontend to Vercel...').start();
    try {
        const frontendDir = join(__dirname, '..', 'apps', 'frontend');
        execSync(`npx vercel deploy --prod --token=${config.vercelToken}`, {
            cwd: frontendDir,
            stdio: 'pipe',
        });
        frontendSpinner.succeed('Frontend deployed');
    } catch (error) {
        frontendSpinner.fail('Frontend deployment failed');
        throw error;
    }

    // Deploy Bot (Deno Deploy)
    const botSpinner = ora('Deploying bot to Deno Deploy...').start();
    try {
        const botDir = join(__dirname, '..', 'apps', 'bot');
        execSync(`deployctl deploy --project=${projectSlug}-bot --token=${config.denoToken} src/main.ts`, {
            cwd: botDir,
            stdio: 'pipe',
        });
        botSpinner.succeed('Bot deployed');
    } catch (error) {
        botSpinner.fail('Bot deployment failed');
        throw error;
    }

    // Get bot username
    const botResponse = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getMe`);
    const botData = await botResponse.json();

    return {
        frontendUrl: config.customDomain
            ? `https://${config.customDomain}`
            : `https://${projectSlug}.vercel.app`,
        botUsername: `@${botData.result.username}`,
        adminEmail: config.adminEmail,
        tempPassword: (config as any).tempPassword,
    };
}

// ============================================================================
// STEP 6: OUTPUT RESULTS
// ============================================================================

function outputResults(result: ProvisionResult): void {
    console.log(chalk.green.bold('\n✅ Provisioning Complete!\n'));
    console.log(chalk.white('─'.repeat(50)));
    console.log(chalk.cyan('  Frontend URL:    ') + chalk.white(result.frontendUrl));
    console.log(chalk.cyan('  Telegram Bot:    ') + chalk.white(result.botUsername));
    console.log(chalk.cyan('  Admin Email:     ') + chalk.white(result.adminEmail));
    console.log(chalk.cyan('  Temp Password:   ') + chalk.yellow(result.tempPassword));
    console.log(chalk.white('─'.repeat(50)));
    console.log(chalk.gray('\n⚠️  Please change the password after first login!\n'));

    // Save to file
    writeFileSync(
        'customer-credentials.json',
        JSON.stringify(result, null, 2)
    );
    console.log(chalk.gray('Credentials saved to customer-credentials.json\n'));
}

// ============================================================================
// UTILITIES
// ============================================================================

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function hashPassword(password: string): Promise<string> {
    // In production, use bcrypt or argon2
    // This is a placeholder - integrate with Payload's auth
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hash).toString('hex');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    try {
        // Step 1: Collect inputs
        const config = await collectInputs();

        // Step 2: Validate connections
        const isValid = await validateConnections(config);
        if (!isValid) {
            console.log(chalk.red('\n❌ Validation failed. Please check credentials and try again.\n'));
            process.exit(1);
        }

        // Confirm before proceeding
        const { proceed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'proceed',
                message: 'All validations passed. Proceed with provisioning?',
                default: true,
            },
        ]);

        if (!proceed) {
            console.log(chalk.yellow('\n⚠️  Provisioning cancelled.\n'));
            process.exit(0);
        }

        // Step 3: Setup MongoDB
        await setupMongoDB(config);

        // Step 4: Run Terraform
        await runTerraform(config);

        // Step 5: Deploy code
        const result = await deployCode(config);

        // Step 6: Output results
        outputResults(result);

    } catch (error) {
        console.error(chalk.red('\n❌ Provisioning failed:'));
        console.error(chalk.red(`  ${(error as Error).message}\n`));
        process.exit(1);
    }
}

main();
