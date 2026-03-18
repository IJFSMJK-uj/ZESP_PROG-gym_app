import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import gymsRoutes from './routes/gyms';

const app = express();
const BACKEND_PORT = 5174;

// MIDDLEWARE
app.use(cors()); // frontend - backend connection
app.use(express.json()); // json parse

// ROUTES
app.get('/', (req, res) => {
  res.send('Backend działa!');
});

// Podpinamy logowanie i rejestrację pod prefix /api/auth
app.use('/api/auth', authRoutes);

app.use('/api/gyms', gymsRoutes);

// START SERWERA
app.listen(BACKEND_PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`.    server http://localhost:${BACKEND_PORT}`);
  console.log(`-----------------------------------------`);
});