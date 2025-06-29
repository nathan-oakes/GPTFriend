// embeddingUtils.js
// Handles storing and retrieving semantic memories using OpenAI embeddings

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Initialize OpenAI client with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Path to local memory store
const MEMORY_FILE = path.resolve(__dirname, 'memory_store.json');

// Ensure memory file exists
if (!fs.existsSync(MEMORY_FILE)) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify([]), 'utf-8');
}

// Compute cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Add a new text memory with embedding
async function addMemory(text) {
  const store = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  const response = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: text });
  const embedding = response.data[0].embedding;
  store.push({ text, embedding });
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// Find top K similar memories for a query
async function findSimilar(text, topK = 5) {
  const store = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  const response = await openai.embeddings.create({ model: 'text-embedding-ada-002', input: text });
  const queryEmbedding = response.data[0].embedding;
  // Compute similarity scores
  const scored = store.map(item => ({ text: item.text, score: cosineSimilarity(queryEmbedding, item.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { addMemory, findSimilar };