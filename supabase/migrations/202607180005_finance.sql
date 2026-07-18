create table if not exists financial_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('revenue', 'expense')),
  parent_id uuid references financial_categories(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (name, type)
);

create table if not exists cost_centers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bank_name text,
  account_type text default 'checking',
  opening_balance_cents integer not null default 0,
  current_balance_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists accounts_receivable (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  sales_order_id uuid references sales_orders(id) on delete set null,
  description text not null,
  installment_number integer default 1,
  due_date date not null,
  received_at date,
  payment_method text,
  gross_amount_cents integer not null default 0 check (gross_amount_cents >= 0),
  fee_cents integer not null default 0 check (fee_cents >= 0),
  net_amount_cents integer not null default 0 check (net_amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'received', 'overdue', 'partial', 'cancelled')),
  category_id uuid references financial_categories(id) on delete set null,
  cost_center_id uuid references cost_centers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts_payable (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete set null,
  description text not null,
  category_id uuid references financial_categories(id) on delete set null,
  cost_center_id uuid references cost_centers(id) on delete set null,
  competence_date date,
  due_date date not null,
  paid_at date,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  interest_cents integer not null default 0 check (interest_cents >= 0),
  fine_cents integer not null default 0 check (fine_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  net_amount_cents integer not null default 0 check (net_amount_cents >= 0),
  payment_method text,
  recurrence text,
  installment_number integer default 1,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'partial', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cash_flow_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  source_type text not null check (source_type in ('receivable', 'payable', 'manual')),
  source_id uuid,
  direction text not null check (direction in ('in', 'out')),
  description text not null,
  amount_cents integer not null default 0,
  status text not null default 'planned' check (status in ('planned', 'realized', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_accounts_receivable_due on accounts_receivable(due_date, status);
create index if not exists idx_accounts_payable_due on accounts_payable(due_date, status);
create index if not exists idx_cash_flow_date on cash_flow_entries(entry_date, direction);

alter table financial_categories enable row level security;
alter table cost_centers enable row level security;
alter table bank_accounts enable row level security;
alter table accounts_receivable enable row level security;
alter table accounts_payable enable row level security;
alter table cash_flow_entries enable row level security;

do $$
declare
  cat_sales uuid;
  cat_supplies uuid;
  cc_general uuid;
  customer_igreja uuid;
  order_demo uuid;
  supplier_demo uuid;
begin
  insert into financial_categories (name, type)
  values
    ('Venda de produtos', 'revenue'),
    ('Compra de insumos', 'expense'),
    ('Embalagens', 'expense'),
    ('Marketing', 'expense'),
    ('Despesas administrativas', 'expense')
  on conflict (name, type) do nothing;

  select id into cat_sales from financial_categories where name = 'Venda de produtos' and type = 'revenue';
  select id into cat_supplies from financial_categories where name = 'Compra de insumos' and type = 'expense';

  insert into cost_centers (code, name, description)
  values
    ('GERAL', 'Geral', 'Centro de custo padrão'),
    ('PROD', 'Produção', 'Custos de produção e materiais'),
    ('COM', 'Comercial', 'Vendas, campanhas e relacionamento')
  on conflict (code) do nothing;

  select id into cc_general from cost_centers where code = 'GERAL';

  insert into bank_accounts (name, bank_name, account_type, opening_balance_cents, current_balance_cents)
  values ('Conta principal', 'Banco demonstrativo', 'checking', 0, 0)
  on conflict do nothing;

  select id into customer_igreja from customers where name = 'Igreja Vida Plena' limit 1;
  select id into order_demo from sales_orders where order_number = 'PED-0001' limit 1;
  select id into supplier_demo from suppliers where trade_name = 'Fornecedor demonstrativo' limit 1;

  insert into accounts_receivable (customer_id, sales_order_id, description, due_date, gross_amount_cents, net_amount_cents, status, category_id, cost_center_id)
  values (customer_igreja, order_demo, 'Pedido PED-0001 - Home Spray Paz', current_date + interval '7 days', 139800, 139800, 'pending', cat_sales, cc_general)
  on conflict do nothing;

  insert into accounts_payable (supplier_id, description, category_id, cost_center_id, competence_date, due_date, amount_cents, net_amount_cents, status)
  values (supplier_demo, 'Compra demonstrativa de frascos e insumos', cat_supplies, cc_general, current_date, current_date + interval '10 days', 85000, 85000, 'pending')
  on conflict do nothing;

  insert into cash_flow_entries (entry_date, source_type, source_id, direction, description, amount_cents, status)
  select due_date, 'receivable', id, 'in', description, net_amount_cents, 'planned'
  from accounts_receivable
  where description = 'Pedido PED-0001 - Home Spray Paz'
  on conflict do nothing;

  insert into cash_flow_entries (entry_date, source_type, source_id, direction, description, amount_cents, status)
  select due_date, 'payable', id, 'out', description, net_amount_cents, 'planned'
  from accounts_payable
  where description = 'Compra demonstrativa de frascos e insumos'
  on conflict do nothing;
end $$;
