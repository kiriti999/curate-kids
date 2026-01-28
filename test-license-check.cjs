require('dotenv').config({ path: 'packages/admin-cli/.env' });
const { MongoClient } = require('mongodb');

async function test() {
    const uri = process.env.CURATEDREELS_ADMIN_MONGODB_URI || process.env.MONGODB_URI;
    console.log('Connecting to:', uri.replace(/:[^:]*@/, ':****@'));

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db();
    console.log('Connected to DB:', db.databaseName);

    const key = 'ck_live_qsAn2gQp1uqCZt7RXh05jvS23Rg8gFTv';
    console.log('Searching for key:', key);

    const license = await db.collection('licenses').findOne({ key });
    console.log(license ? '✅ Found license!' : '❌ License NOT found');

    await client.close();
}

test().catch(console.error);
