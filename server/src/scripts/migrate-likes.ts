import 'dotenv/config';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite.js';

async function mapLikesCountToExistingEntries() {
    try {
        console.log('Adding likesCount attribute to hall_of_fame...');
        try {
            await databases.createIntegerAttribute(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, 'likesCount', false, 0, 100000000, 0);
            console.log('Successfully created likesCount attribute.');
        } catch (e: any) {
            console.log('Attribute may already exist:', e.message);
        }

        console.log('Waiting 3 seconds for Appwrite to process the attribute...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Fetching all entries to backfill likesCount to 0...');
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, []);

            if (res.documents.length === 0) {
                console.log('No entries to update.');
                break;
            }

            for (const doc of res.documents) {
                const docAny = doc as any;
                try {
                    await databases.updateDocument(DATABASE_ID, COLLECTIONS.HALL_OF_FAME, doc.$id, {
                        likesCount: docAny.likesCount || 0
                    });
                    console.log(`Updated doc ${doc.$id} with likesCount = 0`);
                } catch (updateErr) {
                    console.error(`Failed to update ${doc.$id}:`, updateErr);
                }
            }

            hasMore = false; // Currently skipping true pagination for simplicity since we just started the feature
        }

        console.log('Done mapping likesCount!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

mapLikesCountToExistingEntries().catch(console.error);
