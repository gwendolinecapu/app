-- PluralConnect - Database Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SYSTEMS TABLE
CREATE TABLE IF NOT EXISTS systems (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALTERS TABLE
CREATE TABLE IF NOT EXISTS alters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  pronouns TEXT,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  is_host BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id UUID NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  alter_id UUID NOT NULL REFERENCES alters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_alter_id UUID NOT NULL REFERENCES alters(id) ON DELETE CASCADE,
  receiver_alter_id UUID NOT NULL REFERENCES alters(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE alters ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- POLICIES (with DROP IF EXISTS first)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own system" ON systems;
  DROP POLICY IF EXISTS "Users can update own system" ON systems;
  DROP POLICY IF EXISTS "Users can insert own system" ON systems;
  DROP POLICY IF EXISTS "Users can view own alters" ON alters;
  DROP POLICY IF EXISTS "Users can manage own alters" ON alters;
  DROP POLICY IF EXISTS "Users can view own posts" ON posts;
  DROP POLICY IF EXISTS "Users can manage own posts" ON posts;
  DROP POLICY IF EXISTS "Users can view own messages" ON messages;
  DROP POLICY IF EXISTS "Users can send messages" ON messages;
END $$;

CREATE POLICY "Users can view own system" ON systems FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own system" ON systems FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own system" ON systems FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own alters" ON alters FOR SELECT USING (auth.uid() = system_id);
CREATE POLICY "Users can manage own alters" ON alters FOR ALL USING (auth.uid() = system_id);

CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = system_id);
CREATE POLICY "Users can manage own posts" ON posts FOR ALL USING (auth.uid() = system_id);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
  sender_alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
  OR receiver_alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
);

CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
  sender_alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
);
