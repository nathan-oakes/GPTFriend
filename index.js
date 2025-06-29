// index.js
// Main CLI chat app integrating semantic memory

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const OpenAI = require('openai');
const { addMemory, findSimilar } = require('./embeddingUtils');

// Configuration
const MEMORY_FILE = path.resolve(__dirname, 'memory_store.json');
const MAX_MEMORIES = 100;

// Load or create your profile/context
const profilePath = path.resolve(__dirname, 'nathan_profile.json');
let profile = fs.existsSync(profilePath)
  ? JSON.parse(fs.readFileSync(profilePath, 'utf-8'))
  : { summary: "Nathan's Profile Summary goes here." };

// Load or initialize chat history
const historyPath = path.resolve(__dirname, 'chat_history.json');
let history = fs.existsSync(historyPath)
  ? JSON.parse(fs.readFileSync(historyPath, 'utf-8'))
  : [];

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Setup readline
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Main chat loop
async function chat() {
  rl.question('You: ', async (input) => {
    try {
      // Duplicate suppression: skip storing if same as last user message
      const lastUser = history.filter(m => m.role === 'user').pop()?.content;
      if (input && input !== lastUser) {
        await addMemory(input);
        // Prune memory store to last MAX_MEMORIES
        let memStore = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
        if (memStore.length > MAX_MEMORIES) {
          memStore = memStore.slice(-MAX_MEMORIES);
          fs.writeFileSync(MEMORY_FILE, JSON.stringify(memStore, null, 2), 'utf-8');
        }
      }

      // Retrieve top 3 similar memories
      const similar = await findSimilar(input, 3);
      const memoryContext = similar.map(m => m.text).join('\n');

      // Build prompt context
      const context = [
        { role: 'system', content: profile.summary },
        { role: 'system', content: `Relevant memories:\n${memoryContext}` },
        ...history.slice(-10)
      ];

      // Add user input and send to OpenAI
      history.push({ role: 'user', content: input });
      const completion = await openai.chat.completions.create({ model: 'gpt-4o', messages: context });
      const aiMessage = completion.choices[0].message.content;

      // Output AI response and save
      console.log('\nAI:', aiMessage, '\n');
      history.push({ role: 'assistant', content: aiMessage });
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error during chat:', err);
    }
    // Continue loop
    chat();
  });
}

chat();