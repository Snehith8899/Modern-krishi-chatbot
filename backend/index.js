// Import all the necessary modules
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON requests

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    // You can adjust these settings for more creative or deterministic responses
    temperature: 0.7, 
    maxOutputTokens: 2000,
  },
  // This is the core of your "Digital Krishi Officer" persona!
  systemInstruction: "You are an expert agricultural advisor named Digital Krishi Officer. Your purpose is to provide helpful, context-aware advice to farmers about crops, pests, fertilizers, and government schemes. Keep your responses friendly, concise, and easy to understand. Do not provide information outside of agriculture and related topics."
});

// A simple welcome endpoint for testing
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Digital Krishi Officer API!' });
});

// Main chatbot endpoint to handle user queries
app.post('/ask', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Please provide a query in the request body.' });
  }

  try {
    const chat = model.startChat({
      history: [
        // You can pre-seed the chat with a conversation history if needed
      ],
    });

    const result = await chat.sendMessage(query);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});