// embeddingUtils.js

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Path to local memory store
const MEMORY_FILE = path.resolve(__dirname, 'memory_store.json');

// Ensure memory file exists
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify([]), 'utf-8');
}

// Load all memories from disk
function loadMemory() {
  const raw = fs.readFileSync(MEMORY_FILE, 'utf-8');
  return JSON.parse(raw);
}

// Save memories array to disk
function saveMemory(memories) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf-8');
}

// Compute cosine similarity between two vectors
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

// Add a new memory: compute embedding and append to store
async function addMemory(text) {
  const embedRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });
  const embedding = embedRes.data[0].embedding;
  const memories = loadMemory();
  memories.push({ text, embedding });
  saveMemory(memories);
}
const context = [
  { role: 'system', content: profile.summary },
  { role: 'system', content: `Relevant memories:\n${memoryContext}` },
  ...history.slice(-10),
];

// Find top K similar past memories to the given text
async function findSimilar(text, topK = 3) {
  const embedRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });
  const queryEmbedding = embedRes.data[0].embedding;
  const memories = loadMemory();
  const scored = memories.map(m => ({
    text: m.text,
    score: cosineSimilarity(queryEmbedding, m.embedding)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { addMemory, findSimilar };
