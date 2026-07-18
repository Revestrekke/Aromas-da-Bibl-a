create table if not exists fragrances (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  concept text,
  biblical_inspiration text,
  verse text,
  olfactory_family text,
  top_notes text[] not null default '{}',
  heart_notes text[] not null default '{}',
  base_notes text[] not null default '{}',
  commercial_description text,
  technical_description text,
  intensity smallint default 3 check (intensity between 1 and 5),
  estimated_duration text,
  indicated_audience text,
  indicated_environments text,
  season_or_occasion text,
  image_url text,
  color_hex text,
  supplier_name text,
  supplier_essence_code text,
  cost_per_liter_cents integer default 0 check (cost_per_liter_cents >= 0),
  lot_code text,
  expires_at date,
  status text not null default 'active' check (status in ('planned', 'testing', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  legal_name text,
  trade_name text not null,
  document_number text,
  contact_name text,
  phone text,
  whatsapp text,
  email text,
  website text,
  address text,
  category text,
  average_lead_time_days integer default 0,
  minimum_order_cents integer default 0,
  payment_terms text,
  freight_terms text,
  rating numeric(3,2) default 0,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  internal_code text not null unique,
  sku text not null unique,
  barcode text,
  name text not null,
  description text,
  category text not null,
  collection text,
  fragrance_id uuid references fragrances(id) on delete set null,
  volume numeric(10,2),
  unit text default 'un',
  status text not null default 'draft' check (status in ('draft', 'testing', 'active', 'inactive')),
  main_image_url text,
  current_cost_cents integer default 0 check (current_cost_cents >= 0),
  sale_price_cents integer default 0 check (sale_price_cents >= 0),
  promotional_price_cents integer,
  reseller_price_cents integer,
  minimum_price_cents integer,
  desired_margin_percent numeric(5,2) default 55,
  current_stock numeric(12,3) default 0,
  minimum_stock numeric(12,3) default 0,
  maximum_stock numeric(12,3) default 0,
  stock_location text,
  weight_grams integer,
  dimensions text,
  active_on_site boolean not null default false,
  featured_on_site boolean not null default false,
  launch_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists raw_materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null,
  description text,
  unit text not null default 'ml',
  main_supplier_id uuid references suppliers(id) on delete set null,
  current_cost_cents integer default 0 check (current_cost_cents >= 0),
  average_cost_cents integer default 0 check (average_cost_cents >= 0),
  quantity_on_hand numeric(12,3) default 0,
  minimum_stock numeric(12,3) default 0,
  maximum_stock numeric(12,3) default 0,
  lot_code text,
  expires_at date,
  location text,
  technical_document_url text,
  safety_sheet_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists packaging_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null,
  model text,
  capacity text,
  color text,
  material text,
  dimensions text,
  supplier_id uuid references suppliers(id) on delete set null,
  unit_cost_cents integer default 0 check (unit_cost_cents >= 0),
  minimum_purchase_quantity numeric(12,3) default 0,
  lead_time_days integer default 0,
  quantity_on_hand numeric(12,3) default 0,
  minimum_stock numeric(12,3) default 0,
  image_url text,
  compatible_products text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists inventory_locations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null default 'general',
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('product', 'raw_material', 'packaging')),
  item_id uuid not null,
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment', 'reservation', 'release', 'loss', 'inventory')),
  origin text,
  lot_code text,
  quantity numeric(12,3) not null,
  quantity_before numeric(12,3),
  quantity_after numeric(12,3),
  unit_cost_cents integer default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_fragrance on products(fragrance_id);
create index if not exists idx_products_status on products(status) where deleted_at is null;
create index if not exists idx_raw_materials_supplier on raw_materials(main_supplier_id);
create index if not exists idx_packaging_supplier on packaging_items(supplier_id);
create index if not exists idx_inventory_movements_item on inventory_movements(item_type, item_id, created_at desc);

alter table fragrances enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table raw_materials enable row level security;
alter table packaging_items enable row level security;
alter table inventory_locations enable row level security;
alter table inventory_movements enable row level security;

do $$
declare
  paz_id uuid;
  eden_id uuid;
  mansidao_id uuid;
  supplier_id uuid;
begin
  insert into fragrances (code, name, concept, biblical_inspiration, verse, olfactory_family, top_notes, heart_notes, base_notes, commercial_description, color_hex, status)
  values
    ('PAZ', 'Paz', 'Serenidade para leitura, oração e descanso.', 'João 14:27', 'Deixo-vos a paz, a minha paz vos dou.', 'Floral aromático', array['Lavanda'], array['Camomila'], array['Musk'], 'Aroma suave e confortável para ambientes de descanso.', '#173B5F', 'active'),
    ('EDEN', 'Jardim do Éden', 'Frescor verde e acolhedor.', 'Gênesis 2', 'O Senhor Deus plantou um jardim no Éden.', 'Verde floral', array['Folhas verdes'], array['Flores brancas'], array['Madeiras suaves'], 'Fragrância verde e luminosa para criar sensação de cuidado com a casa.', '#88907A', 'planned'),
    ('MANSIDAO', 'Mansidão', 'Delicadeza, equilíbrio e conforto.', 'Mateus 5:5', 'Bem-aventurados os mansos.', 'Amadeirado suave', array['Bergamota'], array['Algodão'], array['Âmbar'], 'Aroma discreto para ambientes tranquilos e acolhedores.', '#B28A51', 'planned')
  on conflict (code) do nothing;

  select id into paz_id from fragrances where code = 'PAZ';
  select id into eden_id from fragrances where code = 'EDEN';
  select id into mansidao_id from fragrances where code = 'MANSIDAO';

  insert into suppliers (trade_name, category, contact_name, status, notes)
  values ('Fornecedor demonstrativo', 'Insumos e embalagens', 'Contato comercial', 'active', 'Dados iniciais editáveis.')
  on conflict do nothing
  returning id into supplier_id;

  if supplier_id is null then
    select id into supplier_id from suppliers where trade_name = 'Fornecedor demonstrativo' limit 1;
  end if;

  insert into products (internal_code, sku, name, description, category, collection, fragrance_id, volume, unit, status, current_cost_cents, sale_price_cents, reseller_price_cents, desired_margin_percent, current_stock, minimum_stock, maximum_stock, stock_location, active_on_site, featured_on_site, launch_date)
  values
    ('PRD-0001', 'ADB-HS-PAZ-200', 'Home Spray Paz 200 ml', 'Aromatizador de ambientes inspirado em João 14:27.', 'Home Spray 200 ml', 'Linha Inicial', paz_id, 200, 'ml', 'active', 3050, 6990, 4890, 55, 42, 12, 150, 'PA-01', true, true, current_date),
    ('PRD-0002', 'ADB-HS-EDEN-200', 'Home Spray Jardim do Éden 200 ml', 'Aromatizador planejado para coleção futura.', 'Home Spray 200 ml', 'Linha Inicial', eden_id, 200, 'ml', 'draft', 0, 6990, 4890, 55, 0, 12, 150, 'PA-02', false, false, null),
    ('PRD-0003', 'ADB-HS-MANS-200', 'Home Spray Mansidão 200 ml', 'Aromatizador planejado para coleção futura.', 'Home Spray 200 ml', 'Linha Inicial', mansidao_id, 200, 'ml', 'draft', 0, 6990, 4890, 55, 0, 12, 150, 'PA-03', false, false, null)
  on conflict (sku) do nothing;

  insert into raw_materials (code, name, type, unit, main_supplier_id, current_cost_cents, average_cost_cents, quantity_on_hand, minimum_stock, maximum_stock, location)
  values
    ('MP-BASE-HS', 'Base para aromatizador', 'base', 'ml', supplier_id, 8, 8, 5000, 1200, 15000, 'MP-01'),
    ('MP-ESS-PAZ', 'Essência Paz', 'essência', 'ml', supplier_id, 18, 18, 900, 300, 3000, 'MP-02')
  on conflict (code) do nothing;

  insert into packaging_items (code, name, type, capacity, color, material, supplier_id, unit_cost_cents, minimum_purchase_quantity, lead_time_days, quantity_on_hand, minimum_stock, compatible_products)
  values
    ('EMB-FRASCO-AMB-200', 'Frasco âmbar 200 ml', 'frasco', '200 ml', 'Âmbar', 'PET', supplier_id, 520, 100, 7, 120, 40, array['Home Spray 200 ml']),
    ('EMB-VALV-PRETA', 'Válvula spray preta', 'válvula', null, 'Preta', 'Plástico', supplier_id, 290, 100, 7, 95, 40, array['Home Spray 200 ml']),
    ('EMB-ROT-PAZ', 'Rótulo Paz', 'rótulo', null, 'Creme', 'Adesivo', supplier_id, 320, 100, 10, 34, 50, array['Home Spray Paz 200 ml'])
  on conflict (code) do nothing;

  insert into inventory_locations (code, name, type, description)
  values
    ('PA-01', 'Produtos acabados - Prateleira 01', 'finished_goods', 'Área de produto acabado'),
    ('MP-01', 'Matérias-primas - Prateleira 01', 'raw_material', 'Área de insumos'),
    ('EMB-01', 'Embalagens - Prateleira 01', 'packaging', 'Área de embalagens')
  on conflict (code) do nothing;
end $$;
