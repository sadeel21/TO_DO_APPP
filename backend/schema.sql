-- Extra columns / tables for subtasks extras, streak days, dhikr goals, achievements.
-- New installs: this file is the full schema. Existing DBs: run the ALTER/CREATE
-- block at the bottom (also listed in the README).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  profile_image_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  list_id INTEGER REFERENCES lists (id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT,
  due_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  completed_at TIMESTAMPTZ,
  image_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subtasks (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS dhikr_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  dhikr_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, dhikr_type, date)
);

CREATE TABLE IF NOT EXISTS dhikr_goals (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  dhikr_type TEXT NOT NULL,
  goal INTEGER NOT NULL CHECK (goal >= 1),
  PRIMARY KEY (user_id, dhikr_type)
);

CREATE TABLE IF NOT EXISTS streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_active_date DATE,
  active_dates JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS achievements_progress (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  unlocked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON tasks (list_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks (task_id);
CREATE INDEX IF NOT EXISTS idx_dhikr_logs_user_date ON dhikr_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements_progress (user_id);

-- Existing todo_app databases: run ONLY the statements below in pgAdmin.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS image_uri TEXT;
ALTER TABLE streaks ADD COLUMN IF NOT EXISTS active_dates JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS dhikr_goals (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  dhikr_type TEXT NOT NULL,
  goal INTEGER NOT NULL CHECK (goal >= 1),
  PRIMARY KEY (user_id, dhikr_type)
);

CREATE TABLE IF NOT EXISTS achievements_progress (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  unlocked_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS dhikr_logs_user_type_date_uidx
  ON dhikr_logs (user_id, dhikr_type, date);
