/**
 * Shared MongoDB Connection
 * Used by all Lambda functions for license management
 * 
 * Uses company MongoDB (not customer's)
 */

const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    // Reuse existing connection (Lambda optimization)
    if (cachedClient && cachedDb) {
        console.log('Reusing cached connection');
        return { client: cachedClient, db: cachedDb };
    }

    // Company MongoDB for license management
    const uri = process.env.MONGODB_URI;
    console.log('MongoDB URI:', uri ? uri.substring(0, 50) + '...' : 'NOT SET');

    if (!uri) {
        throw new Error('MONGODB_URI environment variable not set');
    }

    console.log('Creating new MongoDB client...');
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    });

    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');

    const db = client.db('curatedreels');
    console.log('Using database: curatedreels');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = { connectToDatabase };
