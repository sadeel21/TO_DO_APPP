/**
 * Dhikr daily logs (UNIQUE user_id + dhikr_type + date) and per-type goals.
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
  '/:userId',
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const [logs, goals] = await Promise.all([
      db.query(
        `
          SELECT id, user_id, dhikr_type, count, to_char(date, 'YYYY-MM-DD') AS date
          FROM dhikr_logs
          WHERE user_id = $1
          ORDER BY date DESC, dhikr_type ASC
        `,
        [userId]
      ),
      db.query('SELECT user_id, dhikr_type, goal FROM dhikr_goals WHERE user_id = $1', [userId]),
    ]);
    res.json({ logs: logs.rows, goals: goals.rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { user_id, dhikr_type, date, count, increment, goal } = req.body || {};
    if (!user_id || !dhikr_type) {
      res.status(400).json({ error: 'user_id and dhikr_type are required' });
      return;
    }

    if (goal !== undefined) {
      const safe = Math.max(1, Number(goal) || 1);
      const { rows } = await db.query(
        `
          INSERT INTO dhikr_goals (user_id, dhikr_type, goal)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, dhikr_type)
          DO UPDATE SET goal = EXCLUDED.goal
          RETURNING user_id, dhikr_type, goal
        `,
        [user_id, dhikr_type, safe]
      );
      res.json(rows[0]);
      return;
    }

    const now = new Date();
    const localDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const day = date || localDay;
    const delta = increment === undefined || increment === true ? 1 : Number(increment) || 0;

    let rows;
    if (count !== undefined) {
      const safeCount = Math.max(0, Number(count) || 0);
      rows = (
        await db.query(
          `
            INSERT INTO dhikr_logs (user_id, dhikr_type, count, date)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, dhikr_type, date)
            DO UPDATE SET count = EXCLUDED.count
            RETURNING id, user_id, dhikr_type, count, to_char(date, 'YYYY-MM-DD') AS date
          `,
          [user_id, dhikr_type, safeCount, day]
        )
      ).rows;
    } else {
      rows = (
        await db.query(
          `
            INSERT INTO dhikr_logs (user_id, dhikr_type, count, date)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, dhikr_type, date)
            DO UPDATE SET count = dhikr_logs.count + $3
            RETURNING id, user_id, dhikr_type, count, to_char(date, 'YYYY-MM-DD') AS date
          `,
          [user_id, dhikr_type, delta, day]
        )
      ).rows;
    }

    res.status(201).json(rows[0]);
  })
);

module.exports = router;
