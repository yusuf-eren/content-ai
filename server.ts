import 'dotenv/config';
import mongoose from 'mongoose';
import express, { Response } from 'express';
import cors from 'cors';
import {
  DubbingRequest,
  SummarizeRequest,
  summarizeSchema,
  dubbingSchema,
  generationsQuerySchema,
  GenerationsRequest,
  GenerationDetailRequest,
  generationParamsSchema,
} from './schemas.js';
import { validate } from './validate.js';
import { scrape } from './scrape.js';
import { summarize } from './index.js';
import { generateAudioOpenAI } from './audio.js';
import { authMiddleware, AuthRequest } from './middleware/auth.js';
import { Generation } from './models/Generation.js';
import authRoutes from './routes/auth.js';
import { chunkText } from './utils/chunkText.js';

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
      const { generationId } = req.body;

      const generation = await Generation.findOne({
        _id: generationId,
        userId: req.userId!,
      }).lean();

      if (!generation) {
        return res.status(404).json({ error: 'Generation not found' });
      }

      const text = generation.content;
      const chunks = chunkText(text, 3);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.status(200);

      console.log('chunks', chunks.length);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const audioBase64 = await generateAudioOpenAI(chunk);

        res.write(
          JSON.stringify({
            chunkIndex: i,
            totalChunks: chunks.length,
            audio: audioBase64,
            isLast: i === chunks.length - 1,
          }) + '\n'
        );
      }

      res.end();
    } catch (error) {
      console.error('Audio generation error:', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Failed to generate audio' });
      }
      res.end();
    }
  }
);

app.get(
  '/generations',
  authMiddleware,
  validate(generationsQuerySchema, 'query'),
  async (req: GenerationsRequest & AuthRequest, res: Response) => {
    try {
      const validatedQuery = (req as any).validatedQuery || req.query;
      const { page = 1, limit = 20, type } = validatedQuery;
      
      const query: { userId: string; type?: string } = { userId: req.userId! };
      
      if (type && ['summary', 'podcast', 'learning', 'voice_explanation'].includes(type)) {
        query.type = type;
      }

      const skip = (page - 1) * limit;

      const generations = await Generation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id type title createdAt')
        .lean();

      const total = await Generation.countDocuments(query);

      return res.status(200).json({
        generations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Fetch generations error:', error);
      return res.status(500).json({ error: 'Failed to fetch generations' });
    }
  }
);

app.get(
  '/generations/:id',
  authMiddleware,
  validate(generationParamsSchema, 'params'),
  async (req: GenerationDetailRequest & AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const generation = await Generation.findOne({
        _id: id,
        userId: req.userId!,
      })
        .select('-__v')
        .lean();

      if (!generation) {
        return res.status(404).json({ error: 'Generation not found' });
      }

      return res.status(200).json({ generation });
    } catch (error) {
      console.error('Fetch generation detail error:', error);
      return res.status(500).json({ error: 'Failed to fetch generation' });
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
