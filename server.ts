import 'dotenv/config';
import mongoose from 'mongoose';
import express, { Response } from 'express';
import cors from 'cors';
import {
  DubbingRequest,
  SummarizeRequest,
  summarizeSchema,
  dubbingSchema,
} from './schemas.js';
import { validate } from './validate.js';
import { scrape } from './scrape.js';
import { summarize } from './index.js';
import { generateAudioOpenAI } from './audio.js';
import { authMiddleware, AuthRequest } from './middleware/auth.js';
import { Generation } from './models/Generation.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (_, res) => {
  return res.status(200).send({ message: 'OK' });
});

app.use('/auth', authRoutes);

app.post(
  '/summarize',
  authMiddleware,
  validate(summarizeSchema, 'body'),
  async (req: SummarizeRequest & AuthRequest, res: Response) => {
    try {
      const { contentUrl, ultra } = req.body;
      const content = await scrape(contentUrl);
      const summary = await summarize(content, ultra);

      const generation = new Generation({
        userId: req.userId,
        type: 'summary',
        title: summary.title,
        content: summary.summary,
      });
      await generation.save();

      return res.status(201).json({
        id: generation._id,
        title: summary.title,
        summary: summary.summary,
      });
    } catch (error) {
      console.error('Summarization error:', error);
      return res.status(500).json({ error: 'Failed to summarize content' });
    }
  }
);

app.post(
  '/dubbing',
  authMiddleware,
  validate(dubbingSchema, 'body'),
  async (req: DubbingRequest & AuthRequest, res: Response) => {
    try {
      const { text } = req.body;
      const audioBase64 = await generateAudioOpenAI(text);

      const generation = new Generation({
        userId: req.userId,
        type: 'voice_explanation',
        title: `Voice Explanation - ${text.slice(0, 50)}...`,
        content: text,
      });
      await generation.save();

      return res.status(201).json({
        id: generation._id,
        audio: audioBase64,
      });
    } catch (error) {
      console.error('Audio generation error:', error);
      return res.status(500).json({ error: 'Failed to generate audio' });
    }
  }
);

app.get(
  '/generations',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.query;
      const query: { userId: string; type?: string } = { userId: req.userId! };
      
      if (type && ['summary', 'podcast', 'learning', 'voice_explanation'].includes(type as string)) {
        query.type = type as string;
      }

      const generations = await Generation.find(query)
        .sort({ createdAt: -1 })
        .select('-__v');

      return res.status(200).json({ generations });
    } catch (error) {
      console.error('Fetch generations error:', error);
      return res.status(500).json({ error: 'Failed to fetch generations' });
    }
  }
);

mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    throw new Error('Failed to connect to MongoDB: ' + err);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
