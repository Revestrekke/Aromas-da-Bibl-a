create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.products') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'internal_code') then
      execute 'alter table public.products alter column internal_code drop not null';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'sku') then
      execute 'alter table public.products alter column sku drop not null';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'category') then
      execute 'alter table public.products alter column category drop not null';
    end if;
  end if;

  if to_regclass('public.suppliers') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'suppliers' and column_name = 'trade_name') then
      execute 'alter table public.suppliers alter column trade_name drop not null';
    end if;
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  aroma text,
  volume numeric(12,3) default 0,
  sale_price_cents integer default 0 check (sale_price_cents >= 0),
  current_stock numeric(12,3) default 0 check (current_stock >= 0),
  minimum_stock numeric(12,3) default 0 check (minimum_stock >= 0),
  formula_id uuid,
  active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products add column if not exists code text;
alter table public.products add column if not exists aroma text;
alter table public.products add column if not exists volume numeric(12,3) default 0;
alter table public.products add column if not exists sale_price_cents integer default 0;
alter table public.products add column if not exists current_stock numeric(12,3) default 0;
alter table public.products add column if not exists minimum_stock numeric(12,3) default 0;
alter table public.products add column if not exists formula_id uuid;
alter table public.products add column if not exists active boolean default true;
alter table public.products add column if not exists notes text;
alter table public.products add column if not exists updated_at timestamptz default now();

update public.products
set
  code = coalesce(code, internal_code, sku),
  aroma = coalesce(aroma, category),
  active = coalesce(active, status = 'active', active_on_site, true)
where code is null or aroma is null or active is null;

create unique index if not exists idx_products_simple_code on public.products(code) where code is not null;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact_name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.suppliers add column if not exists name text;
alter table public.suppliers add column if not exists contact_name text;
alter table public.suppliers add column if not exists phone text;
alter table public.suppliers add column if not exists email text;
alter table public.suppliers add column if not exists notes text;
alter table public.suppliers add column if not exists updated_at timestamptz default now();

update public.suppliers
set name = coalesce(name, trade_name)
where name is null;

create table if not exists public.supplies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  unit text not null default 'ml',
  quantity_on_hand numeric(12,3) not null default 0 check (quantity_on_hand >= 0),
  minimum_stock numeric(12,3) not null default 0 check (minimum_stock >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.packaging (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  unit text not null default 'un',
  quantity_on_hand numeric(12,3) not null default 0 check (quantity_on_hand >= 0),
  minimum_stock numeric(12,3) not null default 0 check (minimum_stock >= 0),
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_name text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.formulas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  yield_quantity numeric(12,3) not null check (yield_quantity > 0),
  supplies_cost_cents integer not null default 0 check (supplies_cost_cents >= 0),
  packaging_cost_cents integer not null default 0 check (packaging_cost_cents >= 0),
  total_cost_cents integer not null default 0 check (total_cost_cents >= 0),
  unit_cost_total_cents integer not null default 0 check (unit_cost_total_cents >= 0),
  margin_cents integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.formula_supplies (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references public.formulas(id) on delete cascade,
  supply_id uuid not null references public.supplies(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'ml',
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  total_cost_cents integer not null default 0 check (total_cost_cents >= 0),
  created_at timestamptz default now()
);

create table if not exists public.formula_packaging (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references public.formulas(id) on delete cascade,
  packaging_id uuid not null references public.packaging(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'un',
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  total_cost_cents integer not null default 0 check (total_cost_cents >= 0),
  created_at timestamptz default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date not null default current_date,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  supplier_name text,
  item_type text not null check (item_type in ('supply', 'packaging')),
  item_id uuid not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'un',
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  freight_cents integer not null default 0 check (freight_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  payment_method text,
  status text not null default 'pago' check (status in ('pendente', 'pago')),
  notes text,
  applied_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  item_type text not null check (item_type in ('supply', 'packaging')),
  item_id uuid not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'un',
  unit_cost_cents integer not null default 0 check (unit_cost_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  created_at timestamptz default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,
  item_id uuid not null,
  movement_type text not null,
  quantity numeric(12,3) not null,
  quantity_before numeric(12,3),
  quantity_after numeric(12,3),
  reason text,
  reference_type text,
  reference_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.inventory_movements add column if not exists reason text;
alter table public.inventory_movements add column if not exists reference_type text;
alter table public.inventory_movements add column if not exists reference_id uuid;
alter table public.inventory_movements add column if not exists quantity_before numeric(12,3);
alter table public.inventory_movements add column if not exists quantity_after numeric(12,3);
alter table public.inventory_movements drop constraint if exists inventory_movements_item_type_check;

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  type text not null check (type in ('entrada', 'saida')),
  description text not null,
  category text,
  amount_cents integer not null check (amount_cents >= 0),
  payment_method text,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  purchase_id uuid references public.purchases(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create index if not exists idx_supplies_stock on public.supplies(quantity_on_hand, minimum_stock);
create index if not exists idx_packaging_stock on public.packaging(quantity_on_hand, minimum_stock);
create index if not exists idx_formulas_product on public.formulas(product_id);
create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);
create index if not exists idx_inventory_simple_item on public.inventory_movements(item_type, item_id, created_at desc);
create index if not exists idx_financial_entries_date on public.financial_entries(entry_date desc);
create unique index if not exists idx_purchases_simple_duplicate
  on public.purchases(supplier_id, item_type, item_id, purchase_date, quantity, unit_cost_cents);

insert into public.suppliers (name, contact_name, notes)
values ('Fornecedor inicial', 'Contato comercial', 'Cadastro inicial editavel.')
on conflict do nothing;

insert into public.products (code, internal_code, sku, name, aroma, volume, category, status, active, sale_price_cents, current_stock, minimum_stock, notes)
values ('HS-PAZ-200', 'HS-PAZ-200', 'HS-PAZ-200', 'Home Spray Paz 200 ml', 'Paz', 200, 'Home Spray', 'active', true, 6990, 0, 5, 'Produto inicial inspirado em Joao 14:27.')
on conflict do nothing;

insert into public.supplies (name, category, unit, quantity_on_hand, minimum_stock, unit_cost_cents, supplier_name)
values
  ('Essencia Paz', 'Essencia', 'ml', 0, 100, 18, 'Fornecedor inicial'),
  ('Base para aromatizador', 'Base', 'ml', 0, 500, 8, 'Fornecedor inicial'),
  ('Alcool de cereais', 'Insumo', 'ml', 0, 500, 6, 'Fornecedor inicial'),
  ('Agua deionizada', 'Insumo', 'ml', 0, 500, 2, 'Fornecedor inicial')
on conflict do nothing;

insert into public.packaging (name, type, unit, quantity_on_hand, minimum_stock, unit_cost_cents, supplier_name)
values
  ('Frasco ambar 200 ml', 'Frasco', 'un', 0, 20, 320, 'Fornecedor inicial'),
  ('Valvula spray preta', 'Valvula', 'un', 0, 20, 140, 'Fornecedor inicial'),
  ('Rotulo Paz 200 ml', 'Rotulo', 'un', 0, 20, 90, 'Fornecedor inicial'),
  ('Caixa de envio individual', 'Caixa', 'un', 0, 20, 180, 'Fornecedor inicial')
on conflict do nothing;

insert into public.settings (key, value)
values
  ('company', '{"name":"Aromas da Biblia","currency":"BRL"}'::jsonb),
  ('system', '{"scope":"internal_simple","areas":["inicio","produtos","insumos","embalagens","formulas","compras","financeiro"]}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
