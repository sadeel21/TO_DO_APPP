/**
 * Express entry point.
 * Loads .env first so db.js can read PG* variables.
 */
require('dotenv').config();

const express = require('express');
const tasksRouter = require('./routes/tasks');
const listsRouter = require('./routes/lists');
const usersRouter = require('./routes/users');
const subtasksRouter = require('./routes/subtasks');
const dhikrRouter = require('./routes/dhikr');
const streaksRouter = require('./routes/streaks');
const achievementsRouter = require('./routes/achievements');
const transcribeRouter = require('./routes/transcribe');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/tasks', tasksRouter);
app.use('/subtasks', subtasksRouter);
app.use('/lists', listsRouter);
app.use('/users', usersRouter);
app.use('/dhikr', dhikrRouter);
app.use('/streaks', streaksRouter);
app.use('/achievements', achievementsRouter);
app.use('/transcribe', transcribeRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Audio file is too large (max 25MB).' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
