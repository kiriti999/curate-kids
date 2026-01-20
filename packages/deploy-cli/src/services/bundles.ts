/**
 * Bundle Download Service
 * 
 * Downloads pre-compiled bundles from CDN (authenticated)
 */

import fetch from 'node-fetch'
import { createWriteStream } from 'fs'
import { mkdir } from 'fs/promises'
import { pipeline } from 'stream/promises'
import { extract } from 'tar'
import ora from 'ora'
import chalk from 'chalk'

const BUNDLES_CDN_URL = process.env.BUNDLES_CDN_URL || 'https://releases.curatekids.com'
const BUNDLES_VERSION = '1.0.0'
const BUNDLES_DIR = './.curatekids-bundles'

export interface BundleManifest {
    version: string
    releaseDate: string
    bundles: {
        frontend: string
        cms: string
        bot: string
        schema: string
    }
    checksums: {
        frontend: string
        cms: string
        bot: string
        schema: string
    }
}

/**
 * Download deployment bundles from CDN
 */
export async function downloadBundles(licenseKey: string): Promise<void> {
    const spinner = ora('Downloading deployment bundles...').start()

    try {
        // Create bundles directory
        await mkdir(BUNDLES_DIR, { recursive: true })

        // Get manifest
        spinner.text = 'Fetching bundle manifest...'
        const manifest = await fetchManifest(licenseKey)

        // Download each bundle
        spinner.text = 'Downloading frontend bundle...'
        await downloadBundle(licenseKey, manifest.bundles.frontend, `${BUNDLES_DIR}/frontend.zip`)

        spinner.text = 'Downloading CMS bundle...'
        await downloadBundle(licenseKey, manifest.bundles.cms, `${BUNDLES_DIR}/cms.zip`)

        spinner.text = 'Downloading bot bundle...'
        await downloadBundle(licenseKey, manifest.bundles.bot, `${BUNDLES_DIR}/bot.js`)

        spinner.text = 'Downloading database schema...'
        await downloadBundle(licenseKey, manifest.bundles.schema, `${BUNDLES_DIR}/schema.json`)

        // Verify checksums
        spinner.text = 'Verifying bundle integrity...'
        await verifyChecksums(manifest)

        spinner.succeed('Bundles downloaded and verified')
    } catch (error) {
        spinner.fail('Failed to download bundles')
        throw error
    }
}

/**
 * Fetch bundle manifest
 */
async function fetchManifest(licenseKey: string): Promise<BundleManifest> {
    const url = `${BUNDLES_CDN_URL}/v${BUNDLES_VERSION}/manifest.json`

    const response = await fetch(url, {
        headers: {
            'Authorization': `License ${licenseKey}`,
            'User-Agent': 'curatekids-deploy/1.0.0'
        }
    })

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('License key is not authorized to download bundles')
        }
        throw new Error(`Failed to fetch manifest: ${response.statusText}`)
    }

    return await response.json() as BundleManifest
}

/**
 * Download a single bundle file
 */
async function downloadBundle(
    licenseKey: string,
    bundleUrl: string,
    destPath: string
): Promise<void> {
    const response = await fetch(bundleUrl, {
        headers: {
            'Authorization': `License ${licenseKey}`,
            'User-Agent': 'curatekids-deploy/1.0.0'
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to download bundle: ${response.statusText}`)
    }

    if (!response.body) {
        throw new Error('No response body')
    }

    const fileStream = createWriteStream(destPath)
    await pipeline(response.body, fileStream)
}

/**
 * Verify bundle checksums
 */
async function verifyChecksums(manifest: BundleManifest): Promise<void> {
    const crypto = await import('crypto')
    const fs = await import('fs/promises')

    const files = [
        { path: `${BUNDLES_DIR}/frontend.zip`, checksum: manifest.checksums.frontend },
        { path: `${BUNDLES_DIR}/cms.zip`, checksum: manifest.checksums.cms },
        { path: `${BUNDLES_DIR}/bot.js`, checksum: manifest.checksums.bot },
        { path: `${BUNDLES_DIR}/schema.json`, checksum: manifest.checksums.schema },
    ]

    for (const file of files) {
        const content = await fs.readFile(file.path)
        const hash = crypto.createHash('sha256').update(content).digest('hex')

        if (hash !== file.checksum) {
            throw new Error(`Checksum mismatch for ${file.path}`)
        }
    }
}

/**
 * Extract bundle archives
 */
export async function extractBundles(): Promise<void> {
    const spinner = ora('Extracting bundles...').start()

    try {
        // Extract frontend
        await extract({
            file: `${BUNDLES_DIR}/frontend.zip`,
            cwd: `${BUNDLES_DIR}/frontend`
        })

        // Extract CMS
        await extract({
            file: `${BUNDLES_DIR}/cms.zip`,
            cwd: `${BUNDLES_DIR}/cms`
        })

        spinner.succeed('Bundles extracted')
    } catch (error) {
        spinner.fail('Failed to extract bundles')
        throw error
    }
}

/**
 * Get bundles directory path
 */
export function getBundlesDir(): string {
    return BUNDLES_DIR
}

/**
 * Clean up downloaded bundles
 */
export async function cleanupBundles(): Promise<void> {
    const fs = await import('fs/promises')
    try {
        await fs.rm(BUNDLES_DIR, { recursive: true, force: true })
    } catch (error) {
        // Ignore errors
    }
}
