/**
 * Achievement progress keyed by catalog id (first-week, century, …).
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
    const { rows } = await db.query(
      `
        SELECT user_id, achievement_key, progress, unlocked_at
        FROM achievements_progress
        WHERE user_id = $1
        ORDER BY achievement_key
      `,
      [req.params.userId]
    );
    res.json(rows);
  })
);

router.put(
  '/:userId/:key',
  asyncHandler(async (req, res) => {
    const progress = req.body?.progress === undefined ? 0 : Number(req.body.progress) || 0;
    const unlockedAt = req.body?.unlocked_at === undefined ? null : req.body.unlocked_at;
    const { rows } = await db.query(
      `
        INSERT INTO achievements_progress (user_id, achievement_key, progress, unlocked_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, achievement_key)
        DO UPDATE SET
          progress = EXCLUDED.progress,
          unlocked_at = COALESCE(EXCLUDED.unlocked_at, achievements_progress.unlocked_at)
        RETURNING user_id, achievement_key, progress, unlocked_at
      `,
      [req.params.userId, req.params.key, Math.max(0, progress), unlockedAt]
    );
    res.json(rows[0]);
  })
);

module.exports = router;
