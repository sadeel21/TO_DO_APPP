/**
 * POST /transcribe — multipart audio → OpenAI Whisper → { text }.
 * Accepts field name "audio" or "file". Temp uploads are always deleted.
 */
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const express = require('express');
const multer = require('multer');

const router = express.Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function pickUploadedFile(req) {
  const files = req.files || {};
  const audio = files.audio?.[0];
  const file = files.file?.[0];
  return audio || file || req.file || null;
}

async function removeTemp(filePath) {
  if (!filePath) {
    return;
  }
  await fs.unlink(filePath).catch(() => {});
}

router.post(
  '/',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    const uploaded = pickUploadedFile(req);
    if (!uploaded) {
      res.status(400).json({ error: 'Upload an audio file as "audio" or "file".' });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await removeTemp(uploaded.path);
      res.status(503).json({ error: 'OPENAI_API_KEY is not set on the server.' });
      return;
    }

    const filename = uploaded.originalname || `audio${path.extname(uploaded.path) || '.m4a'}`;

    try {
      const bytes = await fs.readFile(uploaded.path);
      const form = new FormData();
      form.append('file', new Blob([bytes]), filename);
      form.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error?.message || `Whisper request failed (${response.status})`;
        res.status(response.status === 401 ? 502 : 502).json({ error: message });
        return;
      }

      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
      res.json({ text });
    } finally {
      await removeTemp(uploaded.path);
    }
  })
);

module.exports = router;
