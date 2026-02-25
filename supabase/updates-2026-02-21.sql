-- ============================================================
-- ORCHIDÉE NMS — Mise à jour base de données
-- Date : 2026-02-21
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

-- 1. Table paramètres de charte graphique
create table if not exists theme_settings (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid references entities(id) unique,
  color_primary text not null default '#2C5219',
  color_accent text not null default '#C9881A',
  color_bg text not null default '#FAF7F0',
  color_surface text not null default '#FFFFFF',
  color_text text not null default '#1E3B10',
  color_sidebar text not null default '#1E3B10',
  font_heading text not null default 'Cormorant Garamond',
  font_body text not null default 'DM Sans',
  border_radius text not null default 'sharp',
  sidebar_style text not null default 'dark',
  updated_at timestamptz default now()
);
alter table theme_settings enable row level security;
create policy "super_admin_theme" on theme_settings
  for all using (auth.uid() in (select id from users where role = 'super_admin'));
create policy "read_own_theme" on theme_settings
  for select using (auth.uid() in (select id from users where entity_id = theme_settings.entity_id));

-- 2. Table paramètres de sécurité (si pas déjà créée)
create table if not exists security_settings (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid references entities(id) unique,
  auth_method text not null default 'pin' check (auth_method in ('pin','fingerprint','both')),
  session_duration_h int not null default 8,
  max_login_attempts int not null default 5,
  min_password_length int not null default 8,
  require_uppercase boolean default true,
  require_number boolean default true,
  require_special boolean default false,
  updated_at timestamptz default now()
);
alter table security_settings enable row level security;
create policy "super_admin_security_settings" on security_settings
  for all using (auth.uid() in (select id from users where role = 'super_admin'));
create policy "read_own_entity_security_settings" on security_settings
  for select using (auth.uid() in (select id from users where entity_id = security_settings.entity_id));

-- 3. Ajout colonnes manquantes sur users (si pas déjà là)
alter table users add column if not exists pin_code_hash text;
alter table users add column if not exists last_login timestamptz;
alter table users add column if not exists requested_role text check (requested_role in ('manager','vendeur','caissier','readonly'));
alter table users add column if not exists entity_id uuid references entities(id);

-- 4. Fonction get_user_role (nécessaire pour les policies RLS)
create or replace function get_user_role()
returns text as $$
  select role from public.users where id = auth.uid()
$$ language sql security definer;

create or replace function get_user_entity()
returns uuid as $$
  select entity_id from public.users where id = auth.uid()
$$ language sql security definer;

-- 5. Grants pour les tables
grant all on public.users to anon;
grant all on public.users to authenticated;
grant all on public.entities to anon;
grant all on public.entities to authenticated;
grant all on public.products to authenticated;
grant all on public.product_categories to authenticated;
grant all on public.stock to authenticated;
grant all on public.stock_movements to authenticated;
grant all on public.invoices to authenticated;
grant all on public.invoice_lines to authenticated;
grant all on public.orders to authenticated;
grant all on public.order_lines to authenticated;
grant all on public.cash_sessions to authenticated;
grant all on public.cash_movements to authenticated;
grant all on public.audit_logs to authenticated;
grant all on public.notifications to authenticated;
grant all on public.notification_settings to authenticated;
grant all on public.security_settings to authenticated;
grant all on public.theme_settings to authenticated;

-- 6. Trigger : sync auth.users → public.users à la création
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'pending'),
    case when new.raw_user_meta_data->>'requested_role' is not null then 'pending' else 'active' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FIN — Vérification
-- ============================================================
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
