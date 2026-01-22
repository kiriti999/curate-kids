/**
 * MongoDB Setup Script
 * Creates collections, indexes, and initial admin user
 * 
 * Usage: npx ts-node scripts/setup-mongo.ts
 */

import { MongoClient, Db } from 'mongodb';
import * as readline from 'readline';
import * as crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COLLECTIONS = {
    users: 'users',
    videos: 'videos',
    categories: 'categories',
    media: 'media',
    payloadMigrations: 'payload-migrations',
    payloadPreferences: 'payload-preferences',
};

const VIDEO_INDEXES = [
    { key: { slug: 1 }, options: { unique: true } },
    { key: { category: 1 }, options: {} },
    { key: { ageRange: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} },
    { key: { embeddable: 1 }, options: {} },
    { key: { source: 1 }, options: {} },
    { key: { platform: 1 }, options: {} },
    // Text search index
    { key: { title: 'text', tags: 'text' }, options: { name: 'video_text_search' } },
];

const USER_INDEXES = [
    { key: { email: 1 }, options: { unique: true } },
];

// ============================================================================
// HELPERS
// ============================================================================

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ':' + derivedKey.toString('hex'));
        });
    });
}

async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// ============================================================================
// SETUP FUNCTIONS
// ============================================================================

async function createCollections(db: Db): Promise<void> {
    console.log('\n📦 Creating collections...');

    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    for (const [name, collName] of Object.entries(COLLECTIONS)) {
        if (existingNames.includes(collName)) {
            console.log(`  ✓ ${collName} (exists)`);
        } else {
            await db.createCollection(collName);
            console.log(`  ✓ ${collName} (created)`);
        }
    }
}

async function createIndexes(db: Db): Promise<void> {
    console.log('\n🔍 Creating indexes...');

    // Video indexes
    console.log('  Videos:');
    for (const idx of VIDEO_INDEXES) {
        try {
            await db.collection(COLLECTIONS.videos).createIndex(idx.key, idx.options);
            console.log(`    ✓ ${JSON.stringify(idx.key)}`);
        } catch (error) {
            console.log(`    ⚠ ${JSON.stringify(idx.key)} - ${(error as Error).message}`);
        }
    }

    // User indexes
    console.log('  Users:');
    for (const idx of USER_INDEXES) {
        try {
            await db.collection(COLLECTIONS.users).createIndex(idx.key, idx.options);
            console.log(`    ✓ ${JSON.stringify(idx.key)}`);
        } catch (error) {
            console.log(`    ⚠ ${JSON.stringify(idx.key)} - ${(error as Error).message}`);
        }
    }
}

async function createAdminUser(db: Db, email: string): Promise<string> {
    console.log('\n👤 Creating admin user...');

    const existingUser = await db.collection(COLLECTIONS.users).findOne({ email });

    if (existingUser) {
        console.log(`  ⚠ User ${email} already exists`);
        return '';
    }

    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    await db.collection(COLLECTIONS.users).insertOne({
        email,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    console.log(`  ✓ Created admin user: ${email}`);
    return tempPassword;
}

async function seedCategories(db: Db): Promise<void> {
    console.log('\n📁 Seeding categories...');

    const categories = [
        { slug: 'education', label: 'Education', emoji: '📚' },
        { slug: 'entertainment', label: 'Entertainment', emoji: '🎭' },
        { slug: 'music', label: 'Music', emoji: '🎵' },
        { slug: 'science', label: 'Science', emoji: '🔬' },
        { slug: 'arts-crafts', label: 'Arts & Crafts', emoji: '🎨' },
        { slug: 'sports', label: 'Sports', emoji: '⚽' },
        { slug: 'nature', label: 'Nature', emoji: '🌿' },
        { slug: 'stories', label: 'Stories', emoji: '📖' },
    ];

    for (const cat of categories) {
        await db.collection(COLLECTIONS.categories).updateOne(
            { slug: cat.slug },
            { $set: { ...cat, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true }
        );
        console.log(`  ✓ ${cat.emoji} ${cat.label}`);
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log('🗄️  CuratedReels MongoDB Setup\n');
    console.log('─'.repeat(50));

    // Get inputs
    const mongoUri = process.env.MONGODB_URI || await prompt('MongoDB URI: ');
    const adminEmail = process.env.ADMIN_EMAIL || await prompt('Admin Email: ');

    if (!mongoUri || !adminEmail) {
        console.error('❌ MongoDB URI and Admin Email are required');
        process.exit(1);
    }

    // Connect
    console.log('\n🔌 Connecting to MongoDB...');
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('  ✓ Connected');

        const db = client.db();
        console.log(`  ✓ Database: ${db.databaseName}`);

        // Run setup
        await createCollections(db);
        await createIndexes(db);
        await seedCategories(db);
        const tempPassword = await createAdminUser(db, adminEmail);

        // Output
        console.log('\n' + '─'.repeat(50));
        console.log('✅ MongoDB setup complete!\n');

        if (tempPassword) {
            console.log('📋 Admin Credentials:');
            console.log(`   Email:    ${adminEmail}`);
            console.log(`   Password: ${tempPassword}`);
            console.log('\n⚠️  Please change this password after first login!');
        }

    } catch (error) {
        console.error('\n❌ Setup failed:', (error as Error).message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

main();
