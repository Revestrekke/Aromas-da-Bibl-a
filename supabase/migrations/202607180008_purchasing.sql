create table if not exists purchase_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  requester text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  reason text,
  needed_by date,
  status text not null default 'draft' check (status in ('draft', 'quoted', 'approved', 'ordered', 'received', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_request_items (
  id uuid primary key default gen_random_uuid(),
  purchase_request_id uuid not null references purchase_requests(id) on delete cascade,
  item_type text not null check (item_type in ('raw_material', 'packaging')),
  item_id uuid not null,
  description text,
  quantity numeric(12,3) not null default 0,
  unit text not null default 'un',
  estimated_unit_cost_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists purchase_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  purchase_request_id uuid references purchase_requests(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  quoted_at date not null default current_date,
  valid_until date,
  freight_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  payment_terms text,
  delivery_days integer default 0,
  status text not null default 'received' check (status in ('requested', 'received', 'approved', 'rejected', 'expired')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  purchase_request_id uuid references purchase_requests(id) on delete set null,
  purchase_quote_id uuid references purchase_quotes(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  order_date date not null default current_date,
  expected_date date,
  received_at date,
  subtotal_cents integer not null default 0,
  freight_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'confirmed', 'partial_received', 'received', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  item_type text not null check (item_type in ('raw_material', 'packaging')),
  item_id uuid not null,
  description text,
  quantity numeric(12,3) not null default 0,
  received_quantity numeric(12,3) not null default 0,
  unit text not null default 'un',
  unit_cost_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchase_requests_status on purchase_requests(status, priority);
create index if not exists idx_purchase_quotes_request on purchase_quotes(purchase_request_id);
create index if not exists idx_purchase_orders_status on purchase_orders(status, expected_date);
create index if not exists idx_purchase_order_items_order on purchase_order_items(purchase_order_id);

alter table purchase_requests enable row level security;
alter table purchase_request_items enable row level security;
alter table purchase_quotes enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;

do $$
declare
  supplier_demo uuid;
  raw_base uuid;
  pkg_bottle uuid;
  req_demo uuid;
  quote_demo uuid;
  order_demo uuid;
begin
  select id into supplier_demo from suppliers where trade_name = 'Fornecedor demonstrativo' limit 1;
  select id into raw_base from raw_materials where code = 'MP-BASE-HS';
  select id into pkg_bottle from packaging_items where code = 'EMB-FRASCO-AMB-200';

  insert into purchase_requests (request_number, requester, priority, reason, needed_by, status, notes)
  values ('SC-0001', 'Producao', 'high', 'Reposicao para lote piloto Home Spray Paz.', current_date + interval '7 days', 'ordered', 'Solicitacao demonstrativa.')
  on conflict (request_number) do nothing;

  select id into req_demo from purchase_requests where request_number = 'SC-0001';

  if req_demo is not null then
    insert into purchase_request_items (purchase_request_id, item_type, item_id, description, quantity, unit, estimated_unit_cost_cents)
    values
      (req_demo, 'raw_material', raw_base, 'Base para aromatizador', 2000, 'ml', 8),
      (req_demo, 'packaging', pkg_bottle, 'Frasco ambar 200 ml', 50, 'un', 620)
    on conflict do nothing;

    insert into purchase_quotes (quote_number, purchase_request_id, supplier_id, valid_until, freight_cents, total_cents, payment_terms, delivery_days, status, notes)
    values ('COT-0001', req_demo, supplier_demo, current_date + interval '15 days', 3000, 46000, 'Pix ou boleto 7 dias', 5, 'approved', 'Cotacao demonstrativa.')
    on conflict (quote_number) do nothing;

    select id into quote_demo from purchase_quotes where quote_number = 'COT-0001';

    insert into purchase_orders (order_number, purchase_request_id, purchase_quote_id, supplier_id, expected_date, subtotal_cents, freight_cents, total_cents, status, notes)
    values ('OC-0001', req_demo, quote_demo, supplier_demo, current_date + interval '5 days', 43000, 3000, 46000, 'sent', 'Pedido demonstrativo para reposicao.')
    on conflict (order_number) do nothing;

    select id into order_demo from purchase_orders where order_number = 'OC-0001';

    if order_demo is not null then
      insert into purchase_order_items (purchase_order_id, item_type, item_id, description, quantity, unit, unit_cost_cents, total_cents)
      values
        (order_demo, 'raw_material', raw_base, 'Base para aromatizador', 2000, 'ml', 8, 16000),
        (order_demo, 'packaging', pkg_bottle, 'Frasco ambar 200 ml', 50, 'un', 540, 27000)
      on conflict do nothing;
    end if;
  end if;
end $$;
