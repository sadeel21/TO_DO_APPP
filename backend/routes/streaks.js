/**
 * Per-user streak snapshot. active_dates is a JSON object of YYYY-MM-DD → true.
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const EMPTY = {
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  active_dates: {},
};

router.get(
  '/:userId',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `
        SELECT user_id, current_streak, longest_streak, to_char(last_active_date, 'YYYY-MM-DD') AS last_active_date, active_dates
        FROM streaks
        WHERE user_id = $1
      `,
      [req.params.userId]
    );
    if (!rows[0]) {
      res.json({ user_id: Number(req.params.userId), ...EMPTY });
      return;
    }
    res.json(rows[0]);
  })
);

router.put(
  '/:userId',
  asyncHandler(async (req, res) => {
    const { current_streak, longest_streak, last_active_date, active_dates } = req.body || {};
    const { rows } = await db.query(
      `
        INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date, active_dates)
        VALUES ($1, COALESCE($2, 0), COALESCE($3, 0), $4, COALESCE($5, '{}'::jsonb))
        ON CONFLICT (user_id)
        DO UPDATE SET
          current_streak = COALESCE($2, streaks.current_streak),
          longest_streak = COALESCE($3, streaks.longest_streak),
          last_active_date = COALESCE($4, streaks.last_active_date),
          active_dates = COALESCE($5, streaks.active_dates)
        RETURNING user_id, current_streak, longest_streak, to_char(last_active_date, 'YYYY-MM-DD') AS last_active_date, active_dates
      `,
      [
        req.params.userId,
        current_streak === undefined ? null : current_streak,
        longest_streak === undefined ? null : longest_streak,
        last_active_date === undefined ? null : last_active_date,
        active_dates === undefined ? null : JSON.stringify(active_dates),
      ]
    );
    res.json(rows[0]);
  })
);

module.exports = router;
