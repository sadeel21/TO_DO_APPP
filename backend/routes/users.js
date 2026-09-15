/**
 * User login: find by name, or create a new row (no password in this schema).
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const name = req.body?.name && String(req.body.name).trim();
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const existing = await db.query(
      'SELECT id, name, profile_image_url, xp, level, created_at FROM users WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [name]
    );

    if (existing.rows[0]) {
      res.json(existing.rows[0]);
      return;
    }

    const created = await db.query(
      `INSERT INTO users (name) VALUES ($1)
       RETURNING id, name, profile_image_url, xp, level, created_at`,
      [name]
    );
    res.status(201).json(created.rows[0]);
  })
);

module.exports = router;
