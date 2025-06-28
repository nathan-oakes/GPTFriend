require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// Load or create your profile/context
const profilePath = './nathan_profile.json';
let profile = fs.existsSync(profilePath)
  ? JSON.parse(fs.readFileSync(profilePath))
  : { summary: "Nathan Oakes, Kings Beach, ... (etc)" };

// Load chat history
const historyPath = './chat_history.json';
let history = fs.existsSync(historyPath)
  ? JSON.parse(fs.readFileSync(historyPath))
  : [];



const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function chat() {
  rl.question('You: ', async (input) => {
    history.push({ role: "user", content: input });
    // Build context (profile summary + recent messages)
    const context = [
      { role: "system", content: profile.summary },
      ...history.slice(-10) // last 10 messages for context
    ];
    // Send to OpenAI
   const completion = await openai.chat.completions.create({
     model: "gpt-4o",
     messages: context
    });
    const aiMessage = completion.choices[0].message.content;

    console.log('\nAI:', aiMessage, '\n');
    history.push({ role: "assistant", content: aiMessage });
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    chat();
  });
}

chat();
