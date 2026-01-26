/**
 * MongoDB Setup Service
 *
 * Configures MongoDB Atlas database for CuratedReels
 * - Creates collections
 * - Sets up indexes
 * - Seeds initial data
 */
/**
 * Setup MongoDB database
 */
export declare function setupMongoDB(uri: string): Promise<void>;
/**
 * Test MongoDB connection
 */
export declare function testConnection(uri: string): Promise<boolean>;
/**
 * Get database statistics
 */
export declare function getDatabaseStats(uri: string): Promise<any>;
//# sourceMappingURL=mongodb.d.ts.map