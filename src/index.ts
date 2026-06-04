import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { webhookRouter } from './voice/webhook';
import { env } from './config/env';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vapi', webhookRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: env.NODE_ENV, persona: env.PERSONA_NAME });
});

app.listen(env.PORT, () => {
  console.log(`🚀 AI Persona Backend running on port ${env.PORT}`);
});
