/**
 * MongoDB Setup Service
 *
 * Configures MongoDB Atlas database for CuratedReels
 * - Creates collections
 * - Sets up indexes
 * - Seeds initial data
 */
import { MongoClient } from 'mongodb';
import { readFile } from 'fs/promises';
import { getBundlesDir } from './bundles.js';
/**
 * Setup MongoDB database
 */
export async function setupMongoDB(uri) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('curatedreels');
        // Load schema from bundle
        const schema = await loadSchema();
        // Create collections and indexes
        await createCollections(db, schema);
        // Seed initial data
        if (schema.seedData) {
            await seedData(db, schema.seedData);
        }
        // Verify setup
        await verifySetup(db);
    }
    finally {
        await client.close();
    }
}
/**
 * Load database schema from bundle
 */
async function loadSchema() {
    const schemaPath = `${getBundlesDir()}/schema.json`;
    const content = await readFile(schemaPath, 'utf-8');
    return JSON.parse(content);
}
/**
 * Create collections and indexes
 */
async function createCollections(db, schema) {
    for (const collectionDef of schema.collections) {
        const { name, indexes, validator } = collectionDef;
        // Create collection if it doesn't exist
        const collections = await db.listCollections({ name }).toArray();
        if (collections.length === 0) {
            const options = {};
            if (validator) {
                options.validator = validator;
            }
            await db.createCollection(name, options);
        }
        const collection = db.collection(name);
        // Create indexes
        for (const index of indexes) {
            try {
                await collection.createIndex(index.key, {
                    unique: index.unique || false,
                    name: index.name || undefined
                });
            }
            catch (error) {
                // Index might already exist, ignore duplicate key errors
                if (!(error instanceof Error && error.message.includes('already exists'))) {
                    throw error;
                }
            }
        }
    }
}
/**
 * Seed initial data
 */
async function seedData(db, seedData) {
    if (!seedData)
        return;
    for (const seed of seedData) {
        const collection = db.collection(seed.collection);
        // Only seed if collection is empty
        const count = await collection.countDocuments();
        if (count === 0) {
            await collection.insertMany(seed.documents);
        }
    }
}
/**
 * Verify database setup
 */
async function verifySetup(db) {
    // Check required collections exist
    const requiredCollections = ['videos', 'organizations', 'users'];
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    for (const required of requiredCollections) {
        if (!collectionNames.includes(required)) {
            throw new Error(`Required collection ${required} not found`);
        }
    }
    // Check indexes on videos collection
    const videosIndexes = await db.collection('videos').indexes();
    const indexNames = videosIndexes.map((i) => i.name);
    const requiredIndexes = ['slug_1', 'category_1', 'ageRange_1'];
    for (const required of requiredIndexes) {
        if (!indexNames.includes(required)) {
            throw new Error(`Required index ${required} not found on videos collection`);
        }
    }
}
/**
 * Test MongoDB connection
 */
export async function testConnection(uri) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        await client.db().admin().ping();
        return true;
    }
    catch (error) {
        throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
        await client.close();
    }
}
/**
 * Get database statistics
 */
export async function getDatabaseStats(uri) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('curatedreels');
        const stats = await db.stats();
        const collections = await db.listCollections().toArray();
        const collectionStats = await Promise.all(collections.map(async (c) => {
            const coll = db.collection(c.name);
            const count = await coll.countDocuments();
            return {
                name: c.name,
                documentCount: count
            };
        }));
        return {
            database: stats.db,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexesSize: stats.indexSize,
            collections: collectionStats
        };
    }
    finally {
        await client.close();
    }
}
//# sourceMappingURL=mongodb.js.map