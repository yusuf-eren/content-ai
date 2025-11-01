import 'dotenv/config';
import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  DubbingRequest,
  SummarizeRequest,
  summarizeSchema,
} from './schemas.js';
import { validate } from './validate.js';
import { scrape } from './scrape.js';
import { summarize } from './index.js';
import { generateAudioOpenAI } from './audio.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (_, res) => {
  return res.status(200).send({ message: 'OK' });
});

app.post(
  '/summarize',
  validate(summarizeSchema, 'body'),
  async (req: SummarizeRequest, res: Response) => {
    const { contentUrl, ultra } = req.body;
    const content = await scrape(contentUrl);
    const summary = await summarize(content, ultra);

    return res
      .status(201)
      .send({ title: summary.title, summary: summary.summary });
  }
);

app.post('/dubbing', async (req: DubbingRequest, res: Response) => {
  try {
    const { text } = req.body;
    const audioBase64 = await generateAudioOpenAI(text);
    
    return res.status(201).send({ audio: audioBase64 });
  } catch (error) {
    console.error('Audio generation error:', error);
    return res.status(500).json({ error: 'Failed to generate audio' });
  }
});

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
