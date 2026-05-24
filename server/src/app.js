const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./config/db');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

const authRoutes = require('./routes/auth');
const collectionsRoutes = require('./routes/collections');
const requestsRoutes = require('./routes/requests');
const historyRoutes = require('./routes/history');

app.use('/auth', authRoutes);
app.use('/collections', collectionsRoutes);
app.use('/requests', requestsRoutes);
app.use('/history', historyRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'WavePost server is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`WavePost server running on port ${PORT}`);
});