-- PluralConnect - Emotions & Journal Schema
-- Sprint 1 : Suivi émotionnel et journal personnel
-- Run this in Supabase SQL Editor AFTER schema.sql

-- ============================================
-- TABLE: emotions
-- Suivi de l'état émotionnel des alters
-- ============================================
CREATE TABLE IF NOT EXISTS emotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alter_id UUID NOT NULL REFERENCES alters(id) ON DELETE CASCADE,
  -- Types d'émotions: happy, sad, anxious, angry, tired, calm, confused, excited
  emotion TEXT NOT NULL,
  -- Intensité de 1 (faible) à 5 (très forte)
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  -- Note optionnelle pour contexte
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes (historique par alter)
CREATE INDEX IF NOT EXISTS idx_emotions_alter_id ON emotions(alter_id);
CREATE INDEX IF NOT EXISTS idx_emotions_created_at ON emotions(created_at DESC);

-- ============================================
-- TABLE: journal_entries
-- Journal personnel avec option de verrouillage
-- ============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alter_id UUID NOT NULL REFERENCES alters(id) ON DELETE CASCADE,
  -- Titre optionnel de l'entrée
  title TEXT,
  -- Contenu principal (texte)
  content TEXT NOT NULL,
  -- Lien optionnel avec l'humeur du moment
  mood TEXT,
  -- Support audio futur
  is_audio BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  -- Protection de l'entrée (mot de passe requis pour voir)
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_journal_alter_id ON journal_entries(alter_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own emotions" ON emotions;
  DROP POLICY IF EXISTS "Users can manage own emotions" ON emotions;
  DROP POLICY IF EXISTS "Users can view own journal" ON journal_entries;
  DROP POLICY IF EXISTS "Users can manage own journal" ON journal_entries;
END $$;

-- Policies pour emotions
-- Les utilisateurs ne peuvent voir/gérer que les émotions de LEURS alters
CREATE POLICY "Users can view own emotions" ON emotions FOR SELECT USING (
  alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
);

CREATE POLICY "Users can manage own emotions" ON emotions FOR ALL USING (
  alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
);

-- Policies pour journal_entries
CREATE POLICY "Users can view own journal" ON journal_entries FOR SELECT USING (
  alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
);

CREATE POLICY "Users can manage own journal" ON journal_entries FOR ALL USING (
  alter_id IN (SELECT id FROM alters WHERE system_id = auth.uid())
);
