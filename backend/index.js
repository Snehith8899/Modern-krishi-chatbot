import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from './models/Message.js';
import multer from 'multer';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Google Generative AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// FIX APPLIED: Using the simplified model name 'gemini-1.5-flash'
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', 
  generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
  systemInstruction: "You are an expert agricultural advisor who provides concise, accurate, and actionable advice to farmers."
});

// Simple in-memory storage for chat sessions (for history/context persistence)
// NOTE: For production, this should be replaced with database-backed history retrieval
const chatSessions = new Map();

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Digital Krishi Officer API!' });
});

// Text-only conversational endpoint
app.post('/ask', async (req, res) => {
  const { query } = req.body;

  // IMPORTANT: Replace this with logic to get a unique user ID from an authentication token/session
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

    const result = await chat.sendMessage({ message: query });
    const text = result.response.text; // Access the text property directly

    // Save message to MongoDB only after a successful AI response
    const newMessage = new Message({ userId, query, reply: text });
    await newMessage.save();

    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Error generating response:', error);
    // Note: If the error is due to an expired/incorrect model name, this catch block handles it.
    res.status(500).json({ error: 'Failed to get a response from the AI. Check API key and model availability.' });
  }
});

// Multimodal (Text and Image) endpoint
app.post('/ask-multimodal', upload.single('media'), async (req, res) => {
  const { query } = req.body;
  const file = req.file;

  if (!query && !file) {
    return res.status(400).json({ error: 'Please provide a query or an image.' });
  }

  try {
    // Helper function to convert Buffer to GenerativePart format
    function fileToGenerativePart(buffer, mimeType) {
      return {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType
        },
      };
    }

    const parts = [];
    
    // Add file part first (for visual analysis)
    if (file) {
      parts.push(fileToGenerativePart(file.buffer, file.mimetype));
    }
    
    // Add query part
    parts.push(query || "Describe this image and provide agricultural advice based on it.");
    
    // Note: generateContent does not maintain chat history
    const result = await model.generateContent({ contents: parts });
    const text = result.response.text;

    // Save message to MongoDB
    const newMessage = new Message({ 
      userId: req.headers['x-user-id'] || "anonymous_user", 
      query: query || "Multimodal query with image", 
      reply: text 
    });
    await newMessage.save();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Error processing multimodal request:', error);
    res.status(500).json({ error: 'Failed to process your multimodal request.' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});