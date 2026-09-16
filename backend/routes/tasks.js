/**
 * Task REST routes.
 * Pass user_id as a query param on GET, and in the JSON body on POST.
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

const TASK_COLS =
  "id, user_id, list_id, text, completed, priority, category, to_char(due_date, 'YYYY-MM-DD') AS due_date, notes, completed_at, image_uri, created_at";

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.query.user_id;
    const sql = userId
      ? `
        SELECT ${TASK_COLS}
        FROM tasks
        WHERE user_id = $1
        ORDER BY created_at DESC
      `
      : `
        SELECT ${TASK_COLS}
        FROM tasks
        ORDER BY created_at DESC
      `;
    const { rows } = await db.query(sql, userId ? [userId] : []);
    const ids = rows.map((row) => row.id);
    let subtasks = [];
    if (ids.length > 0) {
      const sub = await db.query(
        'SELECT id, task_id, text, completed FROM subtasks WHERE task_id = ANY($1::int[]) ORDER BY id ASC',
        [ids]
      );
      subtasks = sub.rows;
    }
    const byTask = new Map();
    for (const row of rows) {
      byTask.set(row.id, []);
    }
    for (const sub of subtasks) {
      byTask.get(sub.task_id)?.push(sub);
    }
    res.json(rows.map((row) => ({ ...row, subtasks: byTask.get(row.id) || [] })));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id, list_id, text, completed, priority, category, due_date, notes, completed_at, image_uri } = req.body;

    if (!user_id || !text || !String(text).trim()) {
      res.status(400).json({ error: 'user_id and text are required' });
      return;
    }

    const { rows } = await db.query(
      `
        INSERT INTO tasks (user_id, list_id, text, completed, priority, category, due_date, notes, completed_at, image_uri)
        VALUES ($1, $2, $3, COALESCE($4, FALSE), COALESCE($5, 'medium'), $6, $7, COALESCE($8, ''), $9, $10)
        RETURNING ${TASK_COLS}
      `,
      [
        user_id,
        list_id || null,
        String(text).trim(),
        completed,
        priority,
        category || null,
        due_date || null,
        notes || '',
        completed_at || null,
        image_uri || null,
      ]
    );

    res.status(201).json({ ...rows[0], subtasks: [] });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { list_id, text, completed, priority, category, due_date, notes, completed_at, image_uri } = req.body;

    const { rows } = await db.query(
      `
        UPDATE tasks
        SET
          list_id = COALESCE($1, list_id),
          text = COALESCE($2, text),
          completed = COALESCE($3, completed),
          priority = COALESCE($4, priority),
          category = COALESCE($5, category),
          due_date = COALESCE($6, due_date),
          notes = COALESCE($7, notes),
          completed_at = COALESCE($8, completed_at),
          image_uri = COALESCE($9, image_uri)
        WHERE id = $10
        RETURNING ${TASK_COLS}
      `,
      [
        list_id === undefined ? null : list_id,
        text === undefined ? null : String(text).trim(),
        completed === undefined ? null : completed,
        priority === undefined ? null : priority,
        category === undefined ? null : category,
        due_date === undefined ? null : due_date,
        notes === undefined ? null : notes,
        completed_at === undefined ? null : completed_at,
        image_uri === undefined ? null : image_uri,
        id,
      ]
    );

    if (!rows[0]) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (completed === false) {
      const cleared = await db.query(
        `
          UPDATE tasks SET completed_at = NULL WHERE id = $1
          RETURNING ${TASK_COLS}
        `,
        [id]
      );
      res.json(cleared.rows[0]);
      return;
    }

    res.json(rows[0]);
  })
);

router.get(
  '/:id/subtasks',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      'SELECT id, task_id, text, completed FROM subtasks WHERE task_id = $1 ORDER BY id ASC',
      [req.params.id]
    );
    res.json(rows);
  })
);

router.post(
  '/:id/subtasks',
  asyncHandler(async (req, res) => {
    const text = req.body?.text && String(req.body.text).trim();
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const { rows } = await db.query(
      `
        INSERT INTO subtasks (task_id, text, completed)
        VALUES ($1, $2, COALESCE($3, FALSE))
        RETURNING id, task_id, text, completed
      `,
      [req.params.id, text, req.body.completed]
    );
    res.status(201).json(rows[0]);
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
