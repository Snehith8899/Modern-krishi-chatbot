import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Kept for easy API access from a frontend
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Google Generative AI setup
// NOTE: Ensure GEMINI_API_KEY is correctly set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using the correct model name 'gemini-1.5-flash'
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', 
  generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
  systemInstruction: "You are an expert agricultural advisor who provides concise, accurate, and actionable advice to farmers."
});

// Simple in-memory storage for chat sessions (to maintain context/history)
const chatSessions = new Map();

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the simplified Chatbot API!' });
});

// Main Text-only conversational endpoint
app.post('/ask', async (req, res) => {
  const { query } = req.body;

  // For testing, use a placeholder userId. For production, replace this 
  // with a unique ID from an authentication token/session.
  const userId = req.headers['x-user-id'] || "anonymous_user"; 

  if (!query) {
    return res.status(400).json({ error: 'Please provide a query.' });
  }

  try {
    let chat;
    // Get or start a new chat session for the user
    if (chatSessions.has(userId)) {
      chat = chatSessions.get(userId);
    } else {
      // Start a new chat with empty history
      chat = model.startChat({ history: [] });
      chatSessions.set(userId, chat);
    }

    // Pass the 'query' string directly to sendMessage
    const result = await chat.sendMessage(query);
    const text = result.response.text; 

    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error generating response:', error);
    // This catches the 404 error if it persists (due to key/config issues)
    res.status(500).json({ error: 'Failed to get a response from the AI. Check API key and model availability.' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});