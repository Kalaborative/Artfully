import { WORD_BANK } from './words.js';
import type { Difficulty } from '@artfully/shared';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface StoredWord {
  id: string;
  word: string;
  difficulty: Difficulty;
  category: string;
  isActive: boolean;
}

const PERSIST_PATH = path.join(__dirname, '../../data/custom-words.json');

// Load persisted custom words
function loadCustomWords(): StoredWord[] {
  try {
    if (fs.existsSync(PERSIST_PATH)) {
      return JSON.parse(fs.readFileSync(PERSIST_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return [];
}

function saveCustomWords(words: StoredWord[]) {
  const dir = path.dirname(PERSIST_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PERSIST_PATH, JSON.stringify(words, null, 2));
}

// Base words from WORD_BANK (id = "base-<index>")
const baseWords: StoredWord[] = WORD_BANK.map((w, i) => ({
  id: `base-${i}`,
  word: w.word,
  difficulty: w.difficulty,
  category: w.category,
  isActive: true,
}));

// Custom words (added/modified via admin)
let customWords: StoredWord[] = loadCustomWords();

// Overrides: custom words whose id starts with "base-" override base words,
// custom words with "custom-" id are additions.
// Deactivated base word ids
let deactivatedBaseIds = new Set<string>();
let baseOverrides = new Map<string, Partial<StoredWord>>();

function rebuildOverrides() {
  deactivatedBaseIds.clear();
  baseOverrides.clear();
  for (const cw of customWords) {
    if (cw.id.startsWith('base-')) {
      baseOverrides.set(cw.id, cw);
      if (!cw.isActive) deactivatedBaseIds.add(cw.id);
    }
  }
}
rebuildOverrides();

export function getAllWords(): StoredWord[] {
  const merged = baseWords.map(bw => {
    const override = baseOverrides.get(bw.id);
    return override ? { ...bw, ...override } : bw;
  });
  const additions = customWords.filter(cw => cw.id.startsWith('custom-'));
  return [...merged, ...additions];
}

export function getActiveWords(): StoredWord[] {
  return getAllWords().filter(w => w.isActive);
}

export function getWord(id: string): StoredWord | undefined {
  return getAllWords().find(w => w.id === id);
}

export function addWord(word: string, difficulty: Difficulty, category: string): StoredWord {
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const entry: StoredWord = { id, word, difficulty, category, isActive: true };
  customWords.push(entry);
  saveCustomWords(customWords);
  return entry;
}

export function updateWord(id: string, data: Partial<Pick<StoredWord, 'word' | 'difficulty' | 'category' | 'isActive'>>): StoredWord | null {
  const existing = customWords.find(w => w.id === id);
  if (existing) {
    Object.assign(existing, data);
  } else if (id.startsWith('base-')) {
    // Create override for base word
    const base = baseWords.find(bw => bw.id === id);
    if (!base) return null;
    customWords.push({ ...base, ...data });
  } else {
    return null;
  }
  saveCustomWords(customWords);
  rebuildOverrides();
  return getWord(id) || null;
}

export function deleteWord(id: string): boolean {
  if (id.startsWith('base-')) {
    // Can't truly delete base words, just deactivate
    return updateWord(id, { isActive: false }) !== null;
  }
  const idx = customWords.findIndex(w => w.id === id);
  if (idx === -1) return false;
  customWords.splice(idx, 1);
  saveCustomWords(customWords);
  rebuildOverrides();
  return true;
}

export function getCategories(): string[] {
  return [...new Set(getAllWords().map(w => w.category))].sort();
}
