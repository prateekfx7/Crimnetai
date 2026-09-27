import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import Case from './models/Case.js';
import { seed } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

/**
 * Connect to MongoDB — tries local instance first, falls back to in-memory MongoDB
 */
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/criminal_network';

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB (local)');
    return;
  } catch (err) {
    console.log('⚠️  Local MongoDB not available, starting in-memory MongoDB...');
  }

  // Fallback: in-memory MongoDB
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB');
    console.log('   ⚠️  Data will not persist after server restart. Run "npm run seed" to reload sample data.');

    // Store reference for cleanup
    process.on('SIGINT', async () => {
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Failed to start in-memory MongoDB:', err.message);
    console.log('   Install MongoDB locally or ensure mongodb-memory-server is installed.');
    process.exit(1);
  }
}

// Start
connectDB().then(async () => {
  try {
    const caseCount = await Case.countDocuments();
    if (caseCount === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial dataset...');
      await seed({ closeOnComplete: false, connected: true });
    }
  } catch (err) {
    console.error('⚠️  Auto-seed error:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
});

export default app;
