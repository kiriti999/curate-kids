/**
 * Shared MongoDB Connection
 * Used by all Lambda functions
 */

const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    // Reuse existing connection (Lambda optimization)
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI environment variable not set');
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db('curatedreels-licenses');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = { connectToDatabase };
