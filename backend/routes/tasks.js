/**
 * Task REST routes.
 * Pass user_id as a query param on GET, and in the JSON body on POST.
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
      SELECT id, user_id, list_id, text, completed, priority, category, due_date, created_at
      FROM tasks
    `;

    if (userId) {
      values.push(userId);
      sql += ' WHERE user_id = $1';
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await db.query(sql, values);
    res.json(rows);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id, list_id, text, completed, priority, category, due_date } = req.body;

    if (!user_id || !text || !String(text).trim()) {
      res.status(400).json({ error: 'user_id and text are required' });
      return;
    }

    const { rows } = await db.query(
      `
        INSERT INTO tasks (user_id, list_id, text, completed, priority, category, due_date)
        VALUES ($1, $2, $3, COALESCE($4, FALSE), COALESCE($5, 'medium'), $6, $7)
        RETURNING id, user_id, list_id, text, completed, priority, category, due_date, created_at
      `,
      [user_id, list_id || null, String(text).trim(), completed, priority, category || null, due_date || null]
    );

    res.status(201).json(rows[0]);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { list_id, text, completed, priority, category, due_date } = req.body;

    const { rows } = await db.query(
      `
        UPDATE tasks
        SET
          list_id = COALESCE($1, list_id),
          text = COALESCE($2, text),
          completed = COALESCE($3, completed),
          priority = COALESCE($4, priority),
          category = COALESCE($5, category),
          due_date = COALESCE($6, due_date)
        WHERE id = $7
        RETURNING id, user_id, list_id, text, completed, priority, category, due_date, created_at
      `,
      [
        list_id === undefined ? null : list_id,
        text === undefined ? null : String(text).trim(),
        completed === undefined ? null : completed,
        priority === undefined ? null : priority,
        category === undefined ? null : category,
        due_date === undefined ? null : due_date,
        id,
      ]
    );

    if (!rows[0]) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rowCount } = await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);

    if (!rowCount) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(204).send();
  })
);

module.exports = router;
