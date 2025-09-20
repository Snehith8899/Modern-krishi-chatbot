import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from './models/Message.js';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
  systemInstruction: "You are an expert agricultural advisor..."
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Digital Krishi Officer API!' });
});

app.post('/ask', async (req, res) => {
  const { query } = req.body;
  const userId = "anonymous_user";

  if (!query) {
    return res.status(400).json({ error: 'Please provide a query.' });
  }

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(query);
    const text = result.response.text();
    const newMessage = new Message({ userId, query, reply: text });
    await newMessage.save();
    res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Error generating response:', error);
    res.status(500).json({ error: 'Failed to get a response from the AI.' });
  }
});

app.post('/ask-multimodal', upload.single('media'), async (req, res) => {
  const { query } = req.body;
  const file = req.file;

  if (!query && !file) {
    return res.status(400).json({ error: 'Please provide a query or an image.' });
  }

  try {
    const parts = [{ text: query || "What's in this image?" }];
    if (file) {
      parts.push({ inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } });
    }
    const result = await model.generateContent(parts);
    const text = result.response.text();
    const newMessage = new Message({ userId: "anonymous_user", query, reply: text });
    await newMessage.save();
    res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Error processing multimodal request:', error);
    res.status(500).json({ error: 'Failed to process your request.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});