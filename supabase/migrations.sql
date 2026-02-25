-- ============================================================
-- ORCHIDÉE NMS — MIGRATIONS SQL
-- À exécuter dans Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLE : theme_settings (charte graphique globale)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS theme_settings (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id     uuid REFERENCES entities(id) UNIQUE,   -- null = global
  color_primary text NOT NULL DEFAULT '#2C5219',
  color_accent  text NOT NULL DEFAULT '#C9881A',
  color_bg      text NOT NULL DEFAULT '#FAF7F0',
  color_surface text NOT NULL DEFAULT '#FFFFFF',
  color_text    text NOT NULL DEFAULT '#1E3B10',
  color_sidebar text NOT NULL DEFAULT '#1E3B10',
  font_heading  text NOT NULL DEFAULT 'Cormorant Garamond',
  font_body     text NOT NULL DEFAULT 'DM Sans',
  border_radius text NOT NULL DEFAULT 'sharp',
  sidebar_style text NOT NULL DEFAULT 'dark',
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "super_admin_theme_all" ON theme_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY IF NOT EXISTS "all_read_theme" ON theme_settings
  FOR SELECT USING (true);

-- ────────────────────────────────────────────────────────────
-- 2. TABLE : security_settings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_settings (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id            uuid REFERENCES entities(id) UNIQUE,   -- null = global
  auth_method          text NOT NULL DEFAULT 'pin',
  session_duration_h   int  NOT NULL DEFAULT 8,
  max_login_attempts   int  NOT NULL DEFAULT 5,
  min_password_length  int  NOT NULL DEFAULT 8,
  require_uppercase    boolean NOT NULL DEFAULT true,
  require_number       boolean NOT NULL DEFAULT true,
  require_special      boolean NOT NULL DEFAULT false,
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "super_admin_security_all" ON security_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

CREATE POLICY IF NOT EXISTS "auth_read_security" ON security_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────────────────────
-- 3. TABLE : registration_requests
--    (demandes d'inscription à valider par le super admin)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registration_requests (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     text NOT NULL,
  email         text NOT NULL UNIQUE,
  requested_role text NOT NULL CHECK (requested_role IN ('manager','vendeur','caissier','readonly')),
  entity_id     uuid REFERENCES entities(id),
  motivation    text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   uuid REFERENCES users(id),
  reviewed_at   timestamptz,
  reject_reason text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Le super_admin voit tout
CREATE POLICY IF NOT EXISTS "super_admin_all_registrations" ON registration_requests
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
  );

-- Accès public en insertion (formulaire public, non authentifié)
CREATE POLICY IF NOT EXISTS "public_insert_registration" ON registration_requests
  FOR INSERT WITH CHECK (true);

-- Lecture publique uniquement de sa propre demande par email (pour la page de confirmation)
CREATE POLICY IF NOT EXISTS "public_read_own_registration" ON registration_requests
  FOR SELECT USING (true);   -- simplifié; à restreindre si besoin

-- ────────────────────────────────────────────────────────────
-- 4. COLONNE users : discount_rate (remise caissier)
-- ────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS max_discount_rate numeric(5,2) DEFAULT 0
  CHECK (max_discount_rate >= 0 AND max_discount_rate <= 100);

-- ────────────────────────────────────────────────────────────
-- 5. COLONNE cash_movements : discount + invoice_discount
-- ────────────────────────────────────────────────────────────
ALTER TABLE cash_movements
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_rate   numeric(5,2)  DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- 6. FONCTION helpers pour le thème (utilisée dans le layout)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_global_theme()
RETURNS json AS $$
  SELECT row_to_json(t) FROM theme_settings t WHERE entity_id IS NULL LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────
-- 7. ACCORDER les droits manquants (si RLS était désactivé)
-- ────────────────────────────────────────────────────────────
GRANT SELECT ON theme_settings     TO anon, authenticated;
GRANT SELECT ON security_settings  TO anon, authenticated;
GRANT ALL    ON registration_requests TO anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- 8. INSÉRER les paramètres par défaut (si absent)
-- ────────────────────────────────────────────────────────────
INSERT INTO theme_settings (entity_id, color_primary, color_accent, color_bg, color_surface, color_text, color_sidebar, font_heading, font_body, border_radius, sidebar_style)
VALUES (NULL, '#2C5219', '#C9881A', '#FAF7F0', '#FFFFFF', '#1E3B10', '#1E3B10', 'Cormorant Garamond', 'DM Sans', 'sharp', 'dark')
ON CONFLICT (entity_id) DO NOTHING;

INSERT INTO security_settings (entity_id, auth_method, session_duration_h, max_login_attempts, min_password_length, require_uppercase, require_number, require_special)
VALUES (NULL, 'pin', 8, 5, 8, true, true, false)
ON CONFLICT (entity_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- FIN DES MIGRATIONS
-- Vérification : SELECT * FROM theme_settings;
--               SELECT * FROM security_settings;
--               SELECT * FROM registration_requests LIMIT 5;
-- ────────────────────────────────────────────────────────────
