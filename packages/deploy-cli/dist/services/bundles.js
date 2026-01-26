/**
 * Bundle Download Service
 *
 * Downloads pre-compiled bundles from CDN (authenticated)
 */
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { extract } from 'tar';
import ora from 'ora';
import chalk from 'chalk';
// GitHub Releases configuration
const GITHUB_OWNER = 'kiriti999';
const GITHUB_REPO = 'curate-kids';
const BUNDLES_VERSION = process.env.CURATEKIDS_VERSION || '1.0.9';
const BUNDLES_DIR = './.curatedreels-bundles';
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
/**
 * Download deployment bundles from GitHub Releases
 */
export async function downloadBundles(licenseKey) {
    const spinner = ora('Downloading deployment bundles...').start();
    try {
        // Check for GitHub token (required for private repo)
        if (!GITHUB_TOKEN) {
            spinner.fail('GitHub token not found');
            console.log(chalk.yellow('\n⚠️  GitHub token required to download bundles from private repository'));
            console.log(chalk.gray('   Set GITHUB_TOKEN or GH_TOKEN environment variable'));
            console.log(chalk.gray('   Example: export GITHUB_TOKEN=ghp_...'));
            throw new Error('GITHUB_TOKEN environment variable is required');
        }
        // Create bundles directory
        await mkdir(BUNDLES_DIR, { recursive: true });
        // Get manifest from GitHub Release
        spinner.text = 'Fetching bundle manifest...';
        const manifest = await fetchManifestFromGitHub();
        // Download each bundle from GitHub Release
        const version = `v${manifest.version}`;
        spinner.text = 'Downloading frontend bundle...';
        await downloadFromGitHub(version, 'frontend.tar.gz', `${BUNDLES_DIR}/frontend.tar.gz`);
        spinner.text = 'Extracting frontend bundle...';
        await mkdir(`${BUNDLES_DIR}/frontend`, { recursive: true });
        await extract({
            file: `${BUNDLES_DIR}/frontend.tar.gz`,
            cwd: `${BUNDLES_DIR}/frontend`
        });
        spinner.text = 'Downloading CMS bundle...';
        await downloadFromGitHub(version, 'cms.tar.gz', `${BUNDLES_DIR}/cms.tar.gz`);
        spinner.text = 'Extracting CMS bundle...';
        await mkdir(`${BUNDLES_DIR}/cms`, { recursive: true });
        await extract({
            file: `${BUNDLES_DIR}/cms.tar.gz`,
            cwd: `${BUNDLES_DIR}/cms`
        });
        spinner.text = 'Downloading bot bundle...';
        await downloadFromGitHub(version, 'bot.tar.gz', `${BUNDLES_DIR}/bot.tar.gz`);
        spinner.text = 'Extracting bot bundle...';
        await mkdir(`${BUNDLES_DIR}/bot`, { recursive: true });
        await extract({
            file: `${BUNDLES_DIR}/bot.tar.gz`,
            cwd: `${BUNDLES_DIR}/bot`
        });
        spinner.text = 'Downloading database schema...';
        await downloadFromGitHub(version, 'schema.json', `${BUNDLES_DIR}/schema.json`);
        spinner.succeed('Bundles downloaded and extracted');
    }
    catch (error) {
        spinner.fail('Failed to download bundles');
        throw error;
    }
}
/**
 * Get GitHub API headers with authentication
 */
function getGitHubHeaders() {
    const headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'curatedreels-deploy/1.0.0'
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }
    return headers;
}
/**
 * Fetch manifest from GitHub Release using API
 */
async function fetchManifestFromGitHub() {
    // First, get the release
    const releaseUrl = `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/v${BUNDLES_VERSION}`;
    const releaseResponse = await fetch(releaseUrl, {
        headers: getGitHubHeaders()
    });
    if (!releaseResponse.ok) {
        if (releaseResponse.status === 404) {
            throw new Error(`Release v${BUNDLES_VERSION} not found. Check https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`);
        }
        if (releaseResponse.status === 401) {
            throw new Error(`Authentication required. Set GITHUB_TOKEN environment variable.`);
        }
        throw new Error(`Failed to fetch release: ${releaseResponse.statusText}`);
    }
    const release = await releaseResponse.json();
    // Find manifest.json asset
    const manifestAsset = release.assets?.find((a) => a.name === 'manifest.json');
    if (!manifestAsset) {
        throw new Error('manifest.json not found in release assets');
    }
    // Download manifest
    const manifestResponse = await fetch(manifestAsset.url, {
        headers: {
            ...getGitHubHeaders(),
            'Accept': 'application/octet-stream'
        }
    });
    if (!manifestResponse.ok) {
        throw new Error(`Failed to download manifest: ${manifestResponse.statusText}`);
    }
    return await manifestResponse.json();
}
/**
 * Download a file from GitHub Release using authenticated API
 */
async function downloadFromGitHub(version, filename, destPath) {
    // Get release assets
    const releaseUrl = `${GITHUB_API_URL}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${version}`;
    const releaseResponse = await fetch(releaseUrl, {
        headers: getGitHubHeaders()
    });
    if (!releaseResponse.ok) {
        throw new Error(`Failed to fetch release ${version}: ${releaseResponse.statusText}`);
    }
    const release = await releaseResponse.json();
    // Find the asset
    const asset = release.assets?.find((a) => a.name === filename);
    if (!asset) {
        throw new Error(`Asset ${filename} not found in release ${version}`);
    }
    // Download the asset
    const assetResponse = await fetch(asset.url, {
        headers: {
            ...getGitHubHeaders(),
            'Accept': 'application/octet-stream'
        },
        redirect: 'follow'
    });
    if (!assetResponse.ok) {
        throw new Error(`Failed to download ${filename}: ${assetResponse.statusText}`);
    }
    if (!assetResponse.body) {
        throw new Error('No response body');
    }
    const fileStream = createWriteStream(destPath);
    await pipeline(assetResponse.body, fileStream);
}
/**
 * Mock bundle download for development/testing
 */
export async function mockDownloadBundles(_licenseKey) {
    const spinner = ora('Downloading deployment bundles...').start();
    const fs = await import('fs/promises');
    try {
        console.log(chalk.yellow('\n⚠️  Using mock bundle download (development mode)'));
        // Create bundles directory
        await mkdir(BUNDLES_DIR, { recursive: true });
        await mkdir(`${BUNDLES_DIR}/cms`, { recursive: true });
        await mkdir(`${BUNDLES_DIR}/frontend`, { recursive: true });
        // Create mock CMS bundle directory with minimal Next.js structure
        spinner.text = 'Creating mock CMS bundle...';
        await fs.writeFile(`${BUNDLES_DIR}/cms/package.json`, JSON.stringify({
            name: 'mock-cms',
            version: '1.0.0',
            scripts: { build: 'echo mock build', start: 'echo mock start' }
        }, null, 2));
        await fs.writeFile(`${BUNDLES_DIR}/cms/next.config.mjs`, 'export default {}');
        // Create mock frontend bundle directory
        spinner.text = 'Creating mock frontend bundle...';
        await fs.writeFile(`${BUNDLES_DIR}/frontend/package.json`, JSON.stringify({
            name: 'mock-frontend',
            version: '1.0.0',
            scripts: { build: 'echo mock build', start: 'echo mock start' }
        }, null, 2));
        await fs.writeFile(`${BUNDLES_DIR}/frontend/next.config.mjs`, 'export default {}');
        // Create mock bot bundle
        spinner.text = 'Creating mock bot bundle...';
        await fs.writeFile(`${BUNDLES_DIR}/bot.js`, '// Mock bot bundle\nexport default {}');
        // Create mock database schema
        spinner.text = 'Creating mock database schema...';
        const mockSchema = {
            version: '1.0.0',
            collections: [
                {
                    name: 'videos',
                    indexes: [
                        { key: { slug: 1 }, unique: true, name: 'slug_1' },
                        { key: { category: 1 }, name: 'category_1' },
                        { key: { ageRange: 1 }, name: 'ageRange_1' }
                    ]
                },
                {
                    name: 'users',
                    indexes: [
                        { key: { email: 1 }, unique: true, name: 'email_1' }
                    ]
                },
                {
                    name: 'organizations',
                    indexes: [
                        { key: { slug: 1 }, unique: true, name: 'slug_1' }
                    ]
                }
            ]
        };
        await fs.writeFile(`${BUNDLES_DIR}/schema.json`, JSON.stringify(mockSchema, null, 2));
        spinner.succeed('Mock bundles created (development mode)');
    }
    catch (error) {
        spinner.fail('Failed to create mock bundles');
        throw error;
    }
}
/**
 * Extract bundle archives
 */
export async function extractBundles() {
    const spinner = ora('Extracting bundles...').start();
    try {
        await mkdir(`${BUNDLES_DIR}/frontend`, { recursive: true });
        await mkdir(`${BUNDLES_DIR}/cms`, { recursive: true });
        // Extract frontend
        await extract({
            file: `${BUNDLES_DIR}/frontend.tar.gz`,
            cwd: `${BUNDLES_DIR}/frontend`
        });
        // Extract CMS
        await extract({
            file: `${BUNDLES_DIR}/cms.tar.gz`,
            cwd: `${BUNDLES_DIR}/cms`
        });
        spinner.succeed('Bundles extracted');
    }
    catch (error) {
        spinner.fail('Failed to extract bundles');
        throw error;
    }
}
/**
 * Get bundles directory path
 */
export function getBundlesDir() {
    return BUNDLES_DIR;
}
/**
 * Clean up downloaded bundles
 */
export async function cleanupBundles() {
    const fs = await import('fs/promises');
    try {
        await fs.rm(BUNDLES_DIR, { recursive: true, force: true });
    }
    catch (error) {
        // Ignore errors
    }
}
//# sourceMappingURL=bundles.js.map