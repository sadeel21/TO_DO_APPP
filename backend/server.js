/**
 * Express entry point.
 * Loads .env first so db.js can read PG* variables.
 */
require('dotenv').config();

const express = require('express');
const tasksRouter = require('./routes/tasks');
const listsRouter = require('./routes/lists');
const usersRouter = require('./routes/users');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/tasks', tasksRouter);
app.use('/lists', listsRouter);
app.use('/users', usersRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});
