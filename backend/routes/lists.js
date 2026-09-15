/**
 * List REST routes.
 * GET/POST expect user_id (query string on GET, JSON body on POST).
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.query.user_id;
    const values = [];
    let sql = `
      SELECT id, user_id, name, created_at
      FROM lists
    `;

    if (userId) {
      values.push(userId);
      sql += ' WHERE user_id = $1';
    }

    sql += ' ORDER BY created_at ASC';
    const { rows } = await db.query(sql, values);
    res.json(rows);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id, name } = req.body;

    if (!user_id || !name || !String(name).trim()) {
      res.status(400).json({ error: 'user_id and name are required' });
      return;
    }

    const { rows } = await db.query(
      `
        INSERT INTO lists (user_id, name)
        VALUES ($1, $2)
        RETURNING id, user_id, name, created_at
      `,
      [user_id, String(name).trim()]
    );

    res.status(201).json(rows[0]);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rowCount } = await db.query('DELETE FROM lists WHERE id = $1', [req.params.id]);

    if (!rowCount) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    res.status(204).send();
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const name = req.body?.name;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const { rows } = await db.query(
      `
        UPDATE lists
        SET name = $1
        WHERE id = $2
        RETURNING id, user_id, name, created_at
      `,
      [String(name).trim(), req.params.id]
    );

    if (!rows[0]) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    res.json(rows[0]);
  })
);

module.exports = router;
