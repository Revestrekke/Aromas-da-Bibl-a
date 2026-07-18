create table if not exists formulas (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  product_id uuid references products(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'testing', 'approved', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists formula_versions (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references formulas(id) on delete cascade,
  version_number integer not null,
  planned_yield numeric(12,3) not null default 1,
  yield_unit text not null default 'un',
  loss_percent numeric(5,2) not null default 0,
  preparation_mode text,
  rest_time text,
  quality_controls text,
  responsible text,
  approved_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  unique (formula_id, version_number)
);

create table if not exists formula_items (
  id uuid primary key default gen_random_uuid(),
  formula_version_id uuid not null references formula_versions(id) on delete cascade,
  item_type text not null check (item_type in ('raw_material', 'packaging')),
  item_id uuid not null,
  quantity numeric(12,3) not null,
  unit text not null default 'un',
  percentage numeric(7,4),
  cost_cents integer default 0,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists production_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  product_id uuid references products(id) on delete set null,
  formula_id uuid references formulas(id) on delete set null,
  formula_version_id uuid references formula_versions(id) on delete set null,
  fragrance_id uuid references fragrances(id) on delete set null,
  planned_quantity numeric(12,3) not null default 0,
  produced_quantity numeric(12,3) default 0,
  approved_quantity numeric(12,3) default 0,
  lost_quantity numeric(12,3) default 0,
  loss_reason text,
  expected_date date,
  started_at timestamptz,
  completed_at timestamptz,
  responsible text,
  generated_lot text,
  expires_at date,
  status text not null default 'planned' check (status in ('planned', 'materials_separation', 'preparation', 'resting', 'filling', 'labeling', 'quality_control', 'finished', 'cancelled')),
  estimated_cost_cents integer default 0,
  real_cost_cents integer default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists production_order_items (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid not null references production_orders(id) on delete cascade,
  item_type text not null check (item_type in ('raw_material', 'packaging')),
  item_id uuid not null,
  required_quantity numeric(12,3) not null,
  consumed_quantity numeric(12,3) default 0,
  unit_cost_cents integer default 0,
  total_cost_cents integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists production_losses (
  id uuid primary key default gen_random_uuid(),
  production_order_id uuid references production_orders(id) on delete cascade,
  item_type text,
  item_id uuid,
  quantity numeric(12,3) not null default 0,
  reason text,
  cost_cents integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_formula_versions_formula on formula_versions(formula_id, version_number desc);
create index if not exists idx_formula_items_version on formula_items(formula_version_id);
create index if not exists idx_production_orders_status on production_orders(status);
create index if not exists idx_production_order_items_order on production_order_items(production_order_id);

alter table formulas enable row level security;
alter table formula_versions enable row level security;
alter table formula_items enable row level security;
alter table production_orders enable row level security;
alter table production_order_items enable row level security;
alter table production_losses enable row level security;

do $$
declare
  product_paz uuid;
  formula_paz uuid;
  version_paz uuid;
  raw_base uuid;
  raw_essence uuid;
  pkg_bottle uuid;
  pkg_valve uuid;
  pkg_label uuid;
begin
  select id into product_paz from products where sku = 'ADB-HS-PAZ-200';
  select id into raw_base from raw_materials where code = 'MP-BASE-HS';
  select id into raw_essence from raw_materials where code = 'MP-ESS-PAZ';
  select id into pkg_bottle from packaging_items where code = 'EMB-FRASCO-AMB-200';
  select id into pkg_valve from packaging_items where code = 'EMB-VALV-PRETA';
  select id into pkg_label from packaging_items where code = 'EMB-ROT-PAZ';

  if product_paz is not null then
    insert into formulas (code, name, product_id, status)
    values ('FORM-HS-PAZ-200', 'Home Spray Paz 200 ml', product_paz, 'testing')
    on conflict (code) do nothing;

    select id into formula_paz from formulas where code = 'FORM-HS-PAZ-200';

    insert into formula_versions (formula_id, version_number, planned_yield, yield_unit, loss_percent, preparation_mode, rest_time, quality_controls, responsible, status, notes)
    values (formula_paz, 1, 10, 'un', 3, 'Mistura demonstrativa para gestão operacional. Não representa fórmula química definitiva.', '48 horas', 'Conferir aroma, envase, vazamento e rótulo.', 'Produção', 'draft', 'Dados iniciais editáveis.')
    on conflict (formula_id, version_number) do nothing;

    select id into version_paz from formula_versions where formula_id = formula_paz and version_number = 1;

    if version_paz is not null then
      insert into formula_items (formula_version_id, item_type, item_id, quantity, unit, sort_order)
      values
        (version_paz, 'raw_material', raw_base, 1800, 'ml', 1),
        (version_paz, 'raw_material', raw_essence, 200, 'ml', 2),
        (version_paz, 'packaging', pkg_bottle, 10, 'un', 3),
        (version_paz, 'packaging', pkg_valve, 10, 'un', 4),
        (version_paz, 'packaging', pkg_label, 10, 'un', 5)
      on conflict do nothing;
    end if;
  end if;
end $$;
