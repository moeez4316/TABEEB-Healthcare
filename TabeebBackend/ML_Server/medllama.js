// backend/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch'; // Required for Node.js <18

const app = express();
const PORT = 5005;

app.use(cors());
app.use(bodyParser.json());

// ✅ Root route for GET /
app.get('/', (req, res) => {
  res.send('🧠 MedLLaMA Backend is running!');
});

// ✅ POST route for AI chat
app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'medllama2:7b', // Use the exact model name you ran with ollama
        prompt,
        stream: false,
      }),
    });

    const data = await response.json();

    if (!data.response) {
      return res.status(500).json({ error: 'No response from MedLLaMA model' });
    }

    res.json({ response: data.response });
  } catch (error) {
    console.error('❌ Error talking to MedLLaMA:', error);
    res.status(500).json({ error: 'Failed to connect to MedLLaMA' });
  }
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ MedLLaMA backend running at http://localhost:${PORT}`);
});
