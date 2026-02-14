import 'dotenv/config';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite.js';
import WORD_BANK from '../data/words.js';
import { ID } from 'node-appwrite';

async function seedWords() {
  console.log(`Seeding ${WORD_BANK.length} words to database...`);

  let success = 0;
  let failed = 0;

  for (const word of WORD_BANK) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.WORDS,
        ID.unique(),
        {
          word: word.word,
          difficulty: word.difficulty,
          category: word.category,
          timesUsed: 0,
          timesGuessed: 0,
          isActive: true,
        }
      );
      success++;
      if (success % 50 === 0) {
        console.log(`Progress: ${success}/${WORD_BANK.length}`);
      }
    } catch (error: any) {
      failed++;
      console.error(`Failed to add "${word.word}": ${error.message}`);
    }
  }

  console.log(`\nSeeding complete!`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

seedWords().catch(console.error);
