create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  person_type text not null default 'individual' check (person_type in ('individual', 'company')),
  name text not null,
  document_number text,
  phone text,
  whatsapp text,
  email text,
  birth_date date,
  address text,
  city text,
  state text,
  zip_code text,
  origin text,
  acquisition_channel text,
  type text not null default 'consumer' check (type in ('consumer', 'church', 'company', 'reseller', 'representative', 'influencer', 'store', 'event')),
  marketing_consent boolean not null default false,
  notes text,
  status text not null default 'active' check (status in ('lead', 'active', 'inactive', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  title text not null,
  source text,
  estimated_value_cents integer default 0 check (estimated_value_cents >= 0),
  products_summary text,
  quantity numeric(12,3) default 0,
  responsible text,
  next_action text,
  return_date date,
  probability_percent numeric(5,2) default 0,
  lost_reason text,
  notes text,
  stage text not null default 'new_contact' check (stage in ('new_contact', 'contacted', 'interest_identified', 'quote_sent', 'negotiation', 'waiting_decision', 'approved', 'lost', 'after_sales')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  quote_date date not null default current_date,
  valid_until date,
  seller text,
  channel text,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  freight_cents integer not null default 0,
  total_cents integer not null default 0,
  payment_terms text,
  delivery_terms text,
  commercial_terms text,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'negotiation', 'approved', 'rejected', 'expired', 'converted', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references sales_quotes(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit_price_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  quote_id uuid references sales_quotes(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  channel text,
  seller text,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  freight_cents integer not null default 0,
  total_cents integer not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'approved', 'partial', 'paid', 'cancelled')),
  shipping_address text,
  tracking_code text,
  expected_date date,
  notes text,
  status text not null default 'created' check (status in ('created', 'awaiting_payment', 'payment_approved', 'separation', 'production_needed', 'ready_to_ship', 'shipped', 'delivered', 'finished', 'cancelled', 'returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references sales_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  lot_code text,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit_price_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  unit_cost_cents integer not null default 0,
  margin_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_type_status on customers(type, status) where deleted_at is null;
create index if not exists idx_sales_opportunities_stage on sales_opportunities(stage);
create index if not exists idx_sales_quotes_status on sales_quotes(status);
create index if not exists idx_sales_orders_status on sales_orders(status);
create index if not exists idx_sales_order_items_order on sales_order_items(order_id);

alter table customers enable row level security;
alter table sales_opportunities enable row level security;
alter table sales_quotes enable row level security;
alter table sales_quote_items enable row level security;
alter table sales_orders enable row level security;
alter table sales_order_items enable row level security;

do $$
declare
  customer_igreja uuid;
  customer_livraria uuid;
  product_paz uuid;
  quote_id uuid;
  order_id uuid;
begin
  select id into product_paz from products where sku = 'ADB-HS-PAZ-200';

  insert into customers (person_type, name, phone, whatsapp, email, origin, acquisition_channel, type, marketing_consent, status, notes)
  values
    ('company', 'Igreja Vida Plena', '(00) 90000-0000', '(00) 90000-0000', 'contato@vidaplena.example', 'Indicação', 'WhatsApp', 'church', true, 'lead', 'Lead demonstrativo para kits e eventos.'),
    ('company', 'Livraria Caminho', '(00) 91111-1111', '(00) 91111-1111', 'compras@livrariacaminho.example', 'Instagram', 'Instagram', 'reseller', true, 'active', 'Possível revendedor.')
  on conflict do nothing;

  select id into customer_igreja from customers where name = 'Igreja Vida Plena' limit 1;
  select id into customer_livraria from customers where name = 'Livraria Caminho' limit 1;

  insert into sales_opportunities (customer_id, title, source, estimated_value_cents, products_summary, quantity, responsible, next_action, return_date, probability_percent, stage, notes)
  values
    (customer_igreja, 'Kit devocional para encontro de mulheres', 'WhatsApp', 139800, 'Home Spray Paz 200 ml', 20, 'Comercial', 'Enviar orçamento formal', current_date + interval '3 days', 65, 'interest_identified', 'Oportunidade inicial.'),
    (customer_livraria, 'Revenda linha Aromas da Bíblia', 'Instagram', 349500, 'Home Spray Paz 200 ml', 50, 'Comercial', 'Negociar tabela de revenda', current_date + interval '5 days', 55, 'negotiation', 'Avaliar margem por volume.')
  on conflict do nothing;

  insert into sales_quotes (quote_number, customer_id, valid_until, seller, channel, subtotal_cents, discount_cents, freight_cents, total_cents, payment_terms, delivery_terms, status)
  values ('ORC-0001', customer_igreja, current_date + interval '7 days', 'Comercial', 'WhatsApp', 139800, 0, 0, 139800, 'Pix ou cartão', 'Entrega a combinar', 'sent')
  on conflict (quote_number) do nothing;

  select id into quote_id from sales_quotes where quote_number = 'ORC-0001';

  if quote_id is not null and product_paz is not null then
    insert into sales_quote_items (quote_id, product_id, description, quantity, unit_price_cents, total_cents)
    values (quote_id, product_paz, 'Home Spray Paz 200 ml', 20, 6990, 139800)
    on conflict do nothing;
  end if;

  insert into sales_orders (order_number, quote_id, customer_id, channel, seller, subtotal_cents, total_cents, payment_status, status)
  values ('PED-0001', quote_id, customer_igreja, 'WhatsApp', 'Comercial', 139800, 139800, 'pending', 'awaiting_payment')
  on conflict (order_number) do nothing;

  select id into order_id from sales_orders where order_number = 'PED-0001';

  if order_id is not null and product_paz is not null then
    insert into sales_order_items (order_id, product_id, description, quantity, unit_price_cents, total_cents, unit_cost_cents, margin_cents)
    values (order_id, product_paz, 'Home Spray Paz 200 ml', 20, 6990, 139800, 3050, 78800)
    on conflict do nothing;
  end if;
end $$;
