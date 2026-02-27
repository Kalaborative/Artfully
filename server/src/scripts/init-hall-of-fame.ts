import 'dotenv/config';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite.js';
import { ID } from 'node-appwrite';

async function initHallOfFame() {
    console.log('Initializing Hall of Fame collection...');

    try {
        // Check if collection exists first
        try {
            await databases.getCollection(DATABASE_ID, COLLECTIONS.HALL_OF_FAME);
            console.log('Collection already exists. Skipping creation.');
        } catch (e: any) {
            if (e.code === 404) {
                // Create collection
                console.log('Creating collection...');
                await databases.createCollection(
                    DATABASE_ID,
                    COLLECTIONS.HALL_OF_FAME,
                    COLLECTIONS.HALL_OF_FAME
                );

                console.log('Adding attributes...');
                // Create attributes
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'originalDrawingId', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'userId', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'artistName', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'imageFileId', 255, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'imageUrl', 2048, true);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'replayData', 1000000, false);
                await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'createdAt', 255, true);
                await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'likesCount', true, 0, 100000000, 0);

                console.log('Waiting for attributes to be ready...');
                // Wait a bit for attributes to be created before making indices if needed
                await new Promise(resolve => setTimeout(resolve, 3000));

                console.log('Adding indices...');
                await databases.createIndex(
                    DATABASE_ID,
                    COLLECTIONS.HALL_OF_FAME,
                    'idx_createdAt_desc',
                    'key',
                    ['createdAt'],
                    ['DESC']
                );

                console.log('Successfully initialized Hall of Fame collection!');
            } else {
                throw e;
            }
        }
    } catch (error) {
        console.error('Error initializing Hall of Fame collection:', error);
    }
}

initHallOfFame().catch(console.error);
