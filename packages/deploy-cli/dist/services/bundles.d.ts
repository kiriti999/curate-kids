/**
 * Bundle Download Service
 *
 * Downloads pre-compiled bundles from CDN (authenticated)
 */
export interface BundleManifest {
    version: string;
    releaseDate: string;
    bundles: {
        app: string;
        bot: string;
        schema: string;
    };
    checksums?: {
        app?: string;
        bot?: string;
        schema?: string;
    };
}
/**
 * Download deployment bundles from GitHub Releases
 */
export declare function downloadBundles(licenseKey: string): Promise<BundleManifest>;
/**
 * Mock bundle download for development/testing
 */
export declare function mockDownloadBundles(_licenseKey: string): Promise<void>;
/**
 * Extract bundle archives
 */
export declare function extractBundles(): Promise<void>;
/**
 * Get bundles directory path
 */
export declare function getBundlesDir(): string;
/**
 * Clean up downloaded bundles
 */
export declare function cleanupBundles(): Promise<void>;
//# sourceMappingURL=bundles.d.ts.map