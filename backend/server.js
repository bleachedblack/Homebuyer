require('dotenv').config();
const express = require('express');
const cors = require('cors');
const propertyRoutes = require('./routes/property');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      // '*' in the list means allow all origins
      if (allowedOrigins.includes('*')) return cb(null, true);
      // wildcard suffix match, e.g. '*.vercel.app'
      const allowed = allowedOrigins.some((o) => {
        if (o.startsWith('*.')) return origin.endsWith(o.slice(1));
        return o === origin;
      });
      allowed ? cb(null, true) : cb(new Error(`CORS: ${origin} not allowed`));
    },
  })
);
app.use(express.json());
app.use('/api/property', propertyRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
