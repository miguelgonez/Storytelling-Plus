import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import videoRoutes from './routes/video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

app.use('/tmp', express.static(path.join(__dirname, '../tmp')));

app.use('/api', videoRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Video server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video server running on http://0.0.0.0:${PORT}`);
});
