/**
 * PUT /subtasks/:id and DELETE /subtasks/:id
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { text, completed } = req.body || {};
    const { rows } = await db.query(
      `
        UPDATE subtasks
        SET
          text = COALESCE($1, text),
          completed = COALESCE($2, completed)
        WHERE id = $3
        RETURNING id, task_id, text, completed
      `,
      [text === undefined ? null : String(text).trim(), completed === undefined ? null : completed, req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Subtask not found' });
      return;
    }
    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rowCount } = await db.query('DELETE FROM subtasks WHERE id = $1', [req.params.id]);
    if (!rowCount) {
      res.status(404).json({ error: 'Subtask not found' });
      return;
    }
    res.status(204).send();
  })
);

module.exports = router;
