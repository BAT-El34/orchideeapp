create extension if not exists "uuid-ossp";

create table entities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  theme_color text not null default '#7C3AED',
  logo_url text,
  created_at timestamptz default now()
);

create table roles (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  entity_id uuid references entities(id),
  role text not null default 'vendeur',
  pin_code_hash text,
  status text not null default 'pending' check (status in ('pending','active','suspended')),
  last_login timestamptz,
  created_at timestamptz default now()
);

create table permissions (
  id uuid primary key default uuid_generate_v4(),
  role text not null,
  action text not null check (action in ('view','create','edit','delete','export','validate','notify')),
  resource text not null check (resource in ('products','stock','invoices','reports','users','cash_sessions','orders','notifications')),
  entity_id uuid references entities(id),
  enabled boolean default true
);

create table product_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  entity_id uuid references entities(id)
);

create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category_id uuid references product_categories(id),
  price_buy numeric(12,2) not null default 0,
  price_sell numeric(12,2) not null default 0,
  unit text not null default 'unité',
  barcode text,
  entity_id uuid references entities(id),
  active boolean default true,
  created_at timestamptz default now()
);

create table stock (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id),
  entity_id uuid not null references entities(id),
  quantity numeric(12,3) default 0,
  min_threshold numeric(12,3) default 0,
  updated_at timestamptz default now(),
  unique(product_id, entity_id)
);

create table stock_movements (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id),
  entity_id uuid not null references entities(id),
  type text not null check (type in ('IN','OUT','ADJUSTMENT')),
  quantity numeric(12,3) not null,
  reference text,
  user_id uuid references users(id),
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  user_id uuid references users(id),
  date date not null default current_date,
  total_buy numeric(12,2) default 0,
  total_sell numeric(12,2) default 0,
  margin numeric(12,2) default 0,
  status text not null default 'draft' check (status in ('draft','validated','cancelled')),
  notes text,
  created_at timestamptz default now()
);

create table invoice_lines (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid references products(id),
  product_name_snapshot text not null,
  quantity numeric(12,3) not null,
  price_buy numeric(12,2) not null,
  price_sell numeric(12,2) not null,
  total_buy numeric(12,2) not null,
  total_sell numeric(12,2) not null
);

create table cash_sessions (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  cashier_id uuid not null references users(id),
  opening_amount numeric(12,2) default 0,
  closing_amount_declared numeric(12,2),
  closing_amount_calculated numeric(12,2),
  variance numeric(12,2),
  opened_at timestamptz default now(),
  closed_at timestamptz,
  status text not null default 'open' check (status in ('open','closed')),
  notes text
);

create table cash_movements (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references cash_sessions(id),
  type text not null check (type in ('SALE','EXPENSE','DEPOSIT','REFUND')),
  amount numeric(12,2) not null,
  description text,
  invoice_id uuid references invoices(id),
  created_at timestamptz default now()
);

create table orders (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  user_id uuid references users(id),
  type text not null default 'MANUAL' check (type in ('MANUAL','AUTO')),
  status text not null default 'pending_validation' check (status in ('pending_validation','sent','in_preparation','shipped','delivered','cancelled')),
  delivery_date_requested date,
  comment text,
  created_at timestamptz default now()
);

create table order_lines (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name_snapshot text not null,
  quantity_ordered numeric(12,3) not null,
  quantity_delivered numeric(12,3) default 0
);

create table stock_thresholds (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  product_id uuid not null references products(id),
  min_stock numeric(12,3) default 0,
  reorder_qty numeric(12,3) default 0,
  auto_order boolean default false,
  manual_validation_required boolean default true,
  active boolean default true,
  unique(entity_id, product_id)
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid references entities(id),
  from_user_id uuid references users(id),
  to_role text,
  to_user_id uuid references users(id),
  type text not null check (type in ('ORDER','REPORT','ALERT','CASH','VALIDATION')),
  message text not null,
  reference_id uuid,
  channel text not null default 'in_app' check (channel in ('in_app','whatsapp','email')),
  status text not null default 'pending' check (status in ('pending','sent','read','validated')),
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  entity_id uuid references entities(id),
  action text not null,
  resource text not null,
  resource_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz default now()
);

create table daily_reports (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references entities(id),
  user_id uuid references users(id),
  date date not null,
  total_sales numeric(12,2) default 0,
  total_expenses numeric(12,2) default 0,
  nb_transactions integer default 0,
  nb_returns integer default 0,
  pdf_url text,
  validated_by uuid references users(id),
  validated_at timestamptz,
  unique(entity_id, date)
);

create table sync_queue (
  id uuid primary key default uuid_generate_v4(),
  table_name text not null,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  payload jsonb not null,
  synced boolean default false,
  created_at timestamptz default now()
);

alter table entities enable row level security;
alter table users enable row level security;
alter table permissions enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table stock enable row level security;
alter table stock_movements enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table cash_sessions enable row level security;
alter table cash_movements enable row level security;
alter table orders enable row level security;
alter table order_lines enable row level security;
alter table stock_thresholds enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table daily_reports enable row level security;
alter table sync_queue enable row level security;

create or replace function get_user_role()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid()
$$;

create or replace function get_user_entity()
returns uuid language sql stable security definer as $$
  select entity_id from users where id = auth.uid()
$$;

create policy "super_admin_all_entities" on entities
  for all using (get_user_role() = 'super_admin');
create policy "users_read_own_entity" on entities
  for select using (id = get_user_entity());

create policy "super_admin_all_users" on users
  for all using (get_user_role() = 'super_admin');
create policy "admin_manage_entity_users" on users
  for all using (get_user_role() = 'admin' and entity_id = get_user_entity());
create policy "user_read_self" on users
  for select using (id = auth.uid());

create policy "super_admin_all_permissions" on permissions
  for all using (get_user_role() = 'super_admin');
create policy "others_read_permissions" on permissions
  for select using (entity_id = get_user_entity() or entity_id is null);

create policy "super_admin_all_categories" on product_categories
  for all using (get_user_role() = 'super_admin');
create policy "admin_manage_categories" on product_categories
  for all using (get_user_role() = 'admin' and (entity_id = get_user_entity() or entity_id is null));
create policy "others_read_categories" on product_categories
  for select using (entity_id = get_user_entity() or entity_id is null);

create policy "super_admin_all_products" on products
  for all using (get_user_role() = 'super_admin');
create policy "admin_manage_products" on products
  for all using (get_user_role() in ('admin','manager') and (entity_id = get_user_entity() or entity_id is null));
create policy "others_read_products" on products
  for select using (entity_id = get_user_entity() or entity_id is null);

create policy "super_admin_all_stock" on stock
  for all using (get_user_role() = 'super_admin');
create policy "entity_stock" on stock
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager'));
create policy "vendeur_read_stock" on stock
  for select using (entity_id = get_user_entity());

create policy "super_admin_all_stock_movements" on stock_movements
  for all using (get_user_role() = 'super_admin');
create policy "entity_stock_movements" on stock_movements
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager','vendeur'));
create policy "readonly_stock_movements" on stock_movements
  for select using (entity_id = get_user_entity() and get_user_role() = 'readonly');

create policy "super_admin_all_invoices" on invoices
  for all using (get_user_role() = 'super_admin');
create policy "entity_invoices" on invoices
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager','vendeur','caissier'));
create policy "readonly_invoices" on invoices
  for select using (entity_id = get_user_entity() and get_user_role() = 'readonly');

create policy "super_admin_all_invoice_lines" on invoice_lines
  for all using (get_user_role() = 'super_admin');
create policy "entity_invoice_lines" on invoice_lines
  for all using (
    get_user_role() in ('admin','manager','vendeur','caissier','readonly') and
    exists (select 1 from invoices i where i.id = invoice_id and i.entity_id = get_user_entity())
  );

create policy "super_admin_all_cash" on cash_sessions
  for all using (get_user_role() = 'super_admin');
create policy "entity_cash_sessions" on cash_sessions
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager','caissier'));

create policy "super_admin_all_cash_movements" on cash_movements
  for all using (get_user_role() = 'super_admin');
create policy "entity_cash_movements" on cash_movements
  for all using (
    get_user_role() in ('admin','manager','caissier') and
    exists (select 1 from cash_sessions cs where cs.id = session_id and cs.entity_id = get_user_entity())
  );

create policy "super_admin_all_orders" on orders
  for all using (get_user_role() = 'super_admin');
create policy "entity_orders" on orders
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager','vendeur'));

create policy "super_admin_all_order_lines" on order_lines
  for all using (get_user_role() = 'super_admin');
create policy "entity_order_lines" on order_lines
  for all using (
    exists (select 1 from orders o where o.id = order_id and o.entity_id = get_user_entity())
  );

create policy "super_admin_all_thresholds" on stock_thresholds
  for all using (get_user_role() = 'super_admin');
create policy "entity_thresholds" on stock_thresholds
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager'));

create policy "super_admin_all_notifications" on notifications
  for all using (get_user_role() = 'super_admin');
create policy "entity_notifications" on notifications
  for all using (entity_id = get_user_entity() or to_user_id = auth.uid());

create policy "super_admin_all_audit" on audit_logs
  for all using (get_user_role() = 'super_admin');
create policy "admin_read_audit" on audit_logs
  for select using (entity_id = get_user_entity() and get_user_role() = 'admin');

create policy "super_admin_all_reports" on daily_reports
  for all using (get_user_role() = 'super_admin');
create policy "entity_reports" on daily_reports
  for all using (entity_id = get_user_entity() and get_user_role() in ('admin','manager'));

create policy "user_sync_queue" on sync_queue
  for all using (true);

insert into roles (name, description) values
  ('super_admin', 'Accès total à toutes les entités'),
  ('admin', 'Accès total à son entité'),
  ('manager', 'Gestion stock, factures et rapports de son entité'),
  ('vendeur', 'Gestion des ventes et commandes'),
  ('caissier', 'Gestion caisse et encaissements'),
  ('readonly', 'Lecture seule');

insert into entities (id, name, slug, theme_color) values
  ('11111111-1111-1111-1111-111111111111', 'Orchidée Nature', 'orchidee-nature', '#7C3AED'),
  ('22222222-2222-2222-2222-222222222222', 'Antigravity Mom', 'antigravity-mom', '#EA580C');

do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  values (
    v_user_id,
    'admin@orchidee.com',
    crypt('Admin@2024!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Administrateur"}'
  ) on conflict (id) do nothing;

  insert into users (id, email, full_name, entity_id, role, status)
  values (v_user_id, 'admin@orchidee.com', 'Super Administrateur', null, 'super_admin', 'active')
  on conflict (id) do nothing;
end $$;

insert into product_categories (id, name, entity_id) values
  ('aaaa0001-0000-0000-0000-000000000001', 'Pâtisserie & Boulangerie', null),
  ('aaaa0002-0000-0000-0000-000000000002', 'Cosmétiques', null),
  ('aaaa0003-0000-0000-0000-000000000003', 'Épicerie Fine', null);

insert into products (name, category_id, price_buy, price_sell, unit, active) values
  ('Croissant beurre', 'aaaa0001-0000-0000-0000-000000000001', 200, 350, 'pièce', true),
  ('Pain au chocolat', 'aaaa0001-0000-0000-0000-000000000001', 200, 350, 'pièce', true),
  ('Tarte aux fraises', 'aaaa0001-0000-0000-0000-000000000001', 2500, 4000, 'pièce', true),
  ('Éclair au chocolat', 'aaaa0001-0000-0000-0000-000000000001', 500, 850, 'pièce', true),
  ('Mille-feuille', 'aaaa0001-0000-0000-0000-000000000001', 800, 1300, 'pièce', true),
  ('Baguette tradition', 'aaaa0001-0000-0000-0000-000000000001', 150, 250, 'pièce', true),
  ('Financier amande', 'aaaa0001-0000-0000-0000-000000000001', 300, 550, 'pièce', true),
  ('Macaron (6 pcs)', 'aaaa0001-0000-0000-0000-000000000001', 1800, 3200, 'boîte', true),
  ('Cheesecake fruits rouges', 'aaaa0001-0000-0000-0000-000000000001', 3500, 6000, 'part', true),
  ('Brownie chocolat', 'aaaa0001-0000-0000-0000-000000000001', 400, 700, 'pièce', true),
  ('Tarte citron meringuée', 'aaaa0001-0000-0000-0000-000000000001', 2800, 4500, 'pièce', true),
  ('Opéra', 'aaaa0001-0000-0000-0000-000000000001', 2500, 4000, 'part', true),
  ('Paris-Brest', 'aaaa0001-0000-0000-0000-000000000001', 2200, 3800, 'pièce', true),
  ('Saint-Honoré', 'aaaa0001-0000-0000-0000-000000000001', 3000, 5000, 'pièce', true),
  ('Kouign-amann', 'aaaa0001-0000-0000-0000-000000000001', 1500, 2500, 'pièce', true),
  ('Fondant chocolat', 'aaaa0001-0000-0000-0000-000000000001', 600, 1000, 'pièce', true),
  ('Choux crème', 'aaaa0001-0000-0000-0000-000000000001', 400, 700, 'pièce', true),
  ('Cake marbre', 'aaaa0001-0000-0000-0000-000000000001', 2000, 3500, 'pièce', true),
  ('Canelé bordelais', 'aaaa0001-0000-0000-0000-000000000001', 250, 450, 'pièce', true),
  ('Brioche tressée', 'aaaa0001-0000-0000-0000-000000000001', 1200, 2000, 'pièce', true),
  ('Fougasse olives', 'aaaa0001-0000-0000-0000-000000000001', 800, 1400, 'pièce', true),
  ('Feuilleté jambon-fromage', 'aaaa0001-0000-0000-0000-000000000001', 600, 1000, 'pièce', true),
  ('Quiche lorraine', 'aaaa0001-0000-0000-0000-000000000001', 2500, 4000, 'pièce', true),
  ('Biscuit sablé (100g)', 'aaaa0001-0000-0000-0000-000000000001', 800, 1400, 'sachet', true),
  ('Madeleines (12 pcs)', 'aaaa0001-0000-0000-0000-000000000001', 1000, 1700, 'boîte', true),
  ('Mousse au chocolat', 'aaaa0001-0000-0000-0000-000000000001', 700, 1200, 'verrine', true),
  ('Tiramisu', 'aaaa0001-0000-0000-0000-000000000001', 1500, 2500, 'part', true),
  ('Panna cotta vanille', 'aaaa0001-0000-0000-0000-000000000001', 800, 1300, 'verrine', true),
  ('Gâteau basque', 'aaaa0001-0000-0000-0000-000000000001', 2500, 4200, 'pièce', true),
  ('Tarte tatin', 'aaaa0001-0000-0000-0000-000000000001', 2800, 4500, 'pièce', true),
  ('Forêt noire', 'aaaa0001-0000-0000-0000-000000000001', 3500, 6000, 'part', true),
  ('Bûche vanille-framboise', 'aaaa0001-0000-0000-0000-000000000001', 8000, 14000, 'pièce', true),
  ('Galette des rois', 'aaaa0001-0000-0000-0000-000000000001', 4500, 7500, 'pièce', true),
  ('Nougat maison (150g)', 'aaaa0001-0000-0000-0000-000000000001', 1500, 2500, 'sachet', true),
  ('Calisson (8 pcs)', 'aaaa0001-0000-0000-0000-000000000001', 2000, 3500, 'boîte', true),
  ('Florentins (100g)', 'aaaa0001-0000-0000-0000-000000000001', 1800, 3000, 'sachet', true),
  ('Rocher coco', 'aaaa0001-0000-0000-0000-000000000001', 150, 300, 'pièce', true),
  ('Truffes chocolat (6 pcs)', 'aaaa0001-0000-0000-0000-000000000001', 2000, 3500, 'boîte', true),
  ('Pain d''épices tranché', 'aaaa0001-0000-0000-0000-000000000001', 1500, 2500, 'paquet', true),
  ('Palmier feuilleté', 'aaaa0001-0000-0000-0000-000000000001', 200, 400, 'pièce', true),
  ('Crème hydratante visage 50ml', 'aaaa0002-0000-0000-0000-000000000002', 3500, 6500, 'unité', true),
  ('Sérum anti-âge 30ml', 'aaaa0002-0000-0000-0000-000000000002', 6000, 11000, 'unité', true),
  ('Huile de karité pure 100ml', 'aaaa0002-0000-0000-0000-000000000002', 2000, 3800, 'unité', true),
  ('Beurre de cacao 100g', 'aaaa0002-0000-0000-0000-000000000002', 1500, 2800, 'unité', true),
  ('Savon surgras à l''argan', 'aaaa0002-0000-0000-0000-000000000002', 800, 1500, 'pièce', true),
  ('Shampoing naturel 250ml', 'aaaa0002-0000-0000-0000-000000000002', 2500, 4500, 'unité', true),
  ('Après-shampoing 250ml', 'aaaa0002-0000-0000-0000-000000000002', 2500, 4500, 'unité', true),
  ('Masque capillaire 200ml', 'aaaa0002-0000-0000-0000-000000000002', 3000, 5500, 'unité', true),
  ('Huile de coco vierge 200ml', 'aaaa0002-0000-0000-0000-000000000002', 2200, 4000, 'unité', true),
  ('Lotion corporelle 300ml', 'aaaa0002-0000-0000-0000-000000000002', 2800, 5000, 'unité', true),
  ('Gommage corps 200g', 'aaaa0002-0000-0000-0000-000000000002', 3000, 5500, 'unité', true),
  ('Baume à lèvres 10ml', 'aaaa0002-0000-0000-0000-000000000002', 500, 950, 'unité', true),
  ('Eau de rose 100ml', 'aaaa0002-0000-0000-0000-000000000002', 1500, 2800, 'unité', true),
  ('Huile d''argan 30ml', 'aaaa0002-0000-0000-0000-000000000002', 4000, 7500, 'unité', true),
  ('Gel aloe vera 200ml', 'aaaa0002-0000-0000-0000-000000000002', 1800, 3200, 'unité', true),
  ('Toner visage 150ml', 'aaaa0002-0000-0000-0000-000000000002', 2500, 4500, 'unité', true),
  ('Contour des yeux 15ml', 'aaaa0002-0000-0000-0000-000000000002', 4500, 8500, 'unité', true),
  ('Fond de teint SPF30', 'aaaa0002-0000-0000-0000-000000000002', 4000, 7500, 'unité', true),
  ('Highlighter poudre', 'aaaa0002-0000-0000-0000-000000000002', 3000, 5500, 'unité', true),
  ('Masque visage argile 100ml', 'aaaa0002-0000-0000-0000-000000000002', 2000, 3800, 'unité', true),
  ('Déodorant naturel 50ml', 'aaaa0002-0000-0000-0000-000000000002', 1500, 2800, 'unité', true),
  ('Parfum d''ambiance 100ml', 'aaaa0002-0000-0000-0000-000000000002', 3500, 6500, 'unité', true),
  ('Huile essentielle lavande 10ml', 'aaaa0002-0000-0000-0000-000000000002', 1200, 2200, 'unité', true),
  ('Savon au lait de chèvre', 'aaaa0002-0000-0000-0000-000000000002', 900, 1700, 'pièce', true),
  ('Crème solaire SPF50 100ml', 'aaaa0002-0000-0000-0000-000000000002', 3500, 6500, 'unité', true),
  ('Nettoyant doux moussant 150ml', 'aaaa0002-0000-0000-0000-000000000002', 2000, 3800, 'unité', true),
  ('Crème mains réparatrice 75ml', 'aaaa0002-0000-0000-0000-000000000002', 1200, 2200, 'unité', true),
  ('Kit soin visage complet', 'aaaa0002-0000-0000-0000-000000000002', 12000, 22000, 'coffret', true),
  ('Coffret bain relaxant', 'aaaa0002-0000-0000-0000-000000000002', 10000, 18000, 'coffret', true),
  ('Huile de jojoba 50ml', 'aaaa0002-0000-0000-0000-000000000002', 2500, 4500, 'unité', true),
  ('Masque capillaire à la kératine', 'aaaa0002-0000-0000-0000-000000000002', 3500, 6500, 'unité', true),
  ('Sérum éclat vitamine C 30ml', 'aaaa0002-0000-0000-0000-000000000002', 5500, 10000, 'unité', true),
  ('Lait démaquillant 200ml', 'aaaa0002-0000-0000-0000-000000000002', 2000, 3700, 'unité', true),
  ('Huile de nigelle 100ml', 'aaaa0002-0000-0000-0000-000000000002', 2800, 5200, 'unité', true),
  ('Miel de manuka 250g', 'aaaa0003-0000-0000-0000-000000000003', 6000, 11000, 'unité', true),
  ('Confiture fraises artisanale 340g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'pot', true),
  ('Confiture framboises 340g', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3500, 'pot', true),
  ('Confiture abricots 340g', 'aaaa0003-0000-0000-0000-000000000003', 1700, 3000, 'pot', true),
  ('Pâte de pistache 200g', 'aaaa0003-0000-0000-0000-000000000003', 3500, 6500, 'pot', true),
  ('Pâte à tartiner noisette 400g', 'aaaa0003-0000-0000-0000-000000000003', 3000, 5500, 'pot', true),
  ('Huile d''olive extra vierge 500ml', 'aaaa0003-0000-0000-0000-000000000003', 4500, 8000, 'bouteille', true),
  ('Vinaigre balsamique 250ml', 'aaaa0003-0000-0000-0000-000000000003', 2500, 4500, 'bouteille', true),
  ('Moutarde de Dijon 200g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'pot', true),
  ('Cornichons fins 370ml', 'aaaa0003-0000-0000-0000-000000000003', 1200, 2200, 'bocal', true),
  ('Thé vert sencha 50g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'sachet', true),
  ('Thé Earl Grey 50g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'sachet', true),
  ('Thé Rooibos vanille 50g', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3500, 'sachet', true),
  ('Café Blue Mountain moulu 250g', 'aaaa0003-0000-0000-0000-000000000003', 5000, 9000, 'paquet', true),
  ('Café éthiopien Yirgacheffe 250g', 'aaaa0003-0000-0000-0000-000000000003', 4500, 8000, 'paquet', true),
  ('Chocolat noir 70% 100g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'tablette', true),
  ('Chocolat au lait noisettes 100g', 'aaaa0003-0000-0000-0000-000000000003', 1200, 2200, 'tablette', true),
  ('Chocolat blanc 100g', 'aaaa0003-0000-0000-0000-000000000003', 1200, 2200, 'tablette', true),
  ('Sirop d''érable 250ml', 'aaaa0003-0000-0000-0000-000000000003', 3000, 5500, 'bouteille', true),
  ('Sirop de lavande 250ml', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3500, 'bouteille', true),
  ('Fleur de sel de Guérande 250g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'sachet', true),
  ('Piment d''Espelette 50g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'sachet', true),
  ('Safran en pistils 1g', 'aaaa0003-0000-0000-0000-000000000003', 3500, 6500, 'sachet', true),
  ('Vanille Madagascar (2 gousses)', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3800, 'sachet', true),
  ('Amandes entières 200g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'sachet', true),
  ('Noix de cajou 200g', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3500, 'sachet', true),
  ('Pistaches salées 150g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'sachet', true),
  ('Dattes Medjool 500g', 'aaaa0003-0000-0000-0000-000000000003', 3000, 5500, 'sachet', true),
  ('Figues séchées 200g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'sachet', true),
  ('Cranberries séchées 200g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'sachet', true),
  ('Granola artisanal 400g', 'aaaa0003-0000-0000-0000-000000000003', 3000, 5500, 'sachet', true),
  ('Quinoa biologique 500g', 'aaaa0003-0000-0000-0000-000000000003', 2500, 4500, 'sachet', true),
  ('Pâtes artisanales fraîches 500g', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3500, 'sachet', true),
  ('Riz basmati premium 1kg', 'aaaa0003-0000-0000-0000-000000000003', 2800, 5000, 'sachet', true),
  ('Lentilles beluga 500g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'sachet', true),
  ('Chips artisanales truffe 100g', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3800, 'sachet', true),
  ('Crackers à la fleur de sel 150g', 'aaaa0003-0000-0000-0000-000000000003', 1200, 2200, 'sachet', true),
  ('Foie gras de canard 130g', 'aaaa0003-0000-0000-0000-000000000003', 7000, 13000, 'bocal', true),
  ('Tapenades olives noires 100g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'pot', true),
  ('Anchoïade 100g', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'pot', true),
  ('Gelée de fleurs 200g', 'aaaa0003-0000-0000-0000-000000000003', 2500, 4500, 'pot', true),
  ('Cacao en poudre 200g', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'sachet', true),
  ('Extrait de vanille 50ml', 'aaaa0003-0000-0000-0000-000000000003', 1800, 3200, 'flacon', true),
  ('Levure chimique 100g', 'aaaa0003-0000-0000-0000-000000000003', 500, 900, 'sachet', true),
  ('Sucre de canne brut 500g', 'aaaa0003-0000-0000-0000-000000000003', 800, 1500, 'sachet', true),
  ('Farine d''amande 200g', 'aaaa0003-0000-0000-0000-000000000003', 2000, 3700, 'sachet', true),
  ('Lait de coco 400ml', 'aaaa0003-0000-0000-0000-000000000003', 800, 1500, 'boîte', true),
  ('Sauce soja tamari 150ml', 'aaaa0003-0000-0000-0000-000000000003', 1200, 2200, 'bouteille', true),
  ('Coulis de tomates artisanal 500ml', 'aaaa0003-0000-0000-0000-000000000003', 1500, 2800, 'bocal', true);

create index idx_products_category on products(category_id);
create index idx_products_entity on products(entity_id);
create index idx_stock_entity on stock(entity_id);
create index idx_stock_product on stock(product_id);
create index idx_invoices_entity on invoices(entity_id);
create index idx_invoices_date on invoices(date);
create index idx_stock_movements_entity on stock_movements(entity_id);
create index idx_stock_movements_created on stock_movements(created_at);
create index idx_notifications_entity on notifications(entity_id);
create index idx_audit_logs_user on audit_logs(user_id);
create index idx_cash_sessions_entity on cash_sessions(entity_id);
create index idx_sync_queue_synced on sync_queue(synced);
