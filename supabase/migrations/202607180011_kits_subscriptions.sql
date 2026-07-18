create table if not exists product_kits (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  audience text,
  occasion text,
  sale_price_cents integer not null default 0,
  cost_cents integer not null default 0,
  margin_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_kit_items (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references product_kits(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit_cost_cents integer not null default 0,
  unit_price_cents integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  frequency text not null default 'monthly' check (frequency in ('monthly', 'bimonthly', 'quarterly')),
  price_cents integer not null default 0,
  setup_fee_cents integer not null default 0,
  kit_id uuid references product_kits(id) on delete set null,
  minimum_cycles integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscription_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  plan_id uuid references subscription_plans(id) on delete set null,
  start_date date not null default current_date,
  next_billing_date date,
  next_shipping_date date,
  cycles_completed integer not null default 0,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled', 'finished')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_cycles (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references customer_subscriptions(id) on delete cascade,
  cycle_number integer not null,
  billing_date date not null,
  shipping_date date,
  amount_cents integer not null default 0,
  sales_order_id uuid references sales_orders(id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'billed', 'shipped', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  unique (subscription_id, cycle_number)
);

create index if not exists idx_product_kit_items_kit on product_kit_items(kit_id);
create index if not exists idx_subscription_plans_active on subscription_plans(active);
create index if not exists idx_customer_subscriptions_status on customer_subscriptions(status, next_billing_date);
create index if not exists idx_subscription_cycles_subscription on subscription_cycles(subscription_id, cycle_number);

alter table product_kits enable row level security;
alter table product_kit_items enable row level security;
alter table subscription_plans enable row level security;
alter table customer_subscriptions enable row level security;
alter table subscription_cycles enable row level security;

do $$
declare
  product_paz uuid;
  customer_igreja uuid;
  kit_paz uuid;
  plan_paz uuid;
  subscription_paz uuid;
begin
  select id into product_paz from products where sku = 'ADB-HS-PAZ-200';
  select id into customer_igreja from customers where name = 'Igreja Vida Plena' limit 1;

  insert into product_kits (code, name, description, audience, occasion, sale_price_cents, cost_cents, margin_cents, active)
  values ('KIT-PAZ-DEV-01', 'Kit Devocional Paz', 'Kit demonstrativo com Home Spray Paz e embalagem presenteavel.', 'Igrejas, grupos de leitura e presentes cristãos.', 'Encontros, visitas e devocionais.', 8990, 4200, 4790, true)
  on conflict (code) do nothing;

  select id into kit_paz from product_kits where code = 'KIT-PAZ-DEV-01';

  if kit_paz is not null then
    insert into product_kit_items (kit_id, product_id, description, quantity, unit_cost_cents, unit_price_cents, sort_order)
    values
      (kit_paz, product_paz, 'Home Spray Paz 200 ml', 1, 3050, 6990, 1),
      (kit_paz, null, 'Embalagem presenteavel e cartao devocional', 1, 1150, 2000, 2)
    on conflict do nothing;

    insert into subscription_plans (code, name, description, frequency, price_cents, setup_fee_cents, kit_id, minimum_cycles, active)
    values ('ASS-PAZ-MENSAL', 'Assinatura Paz Mensal', 'Envio mensal de aroma e mensagem devocional.', 'monthly', 7990, 0, kit_paz, 3, true)
    on conflict (code) do nothing;

    select id into plan_paz from subscription_plans where code = 'ASS-PAZ-MENSAL';

    if customer_igreja is not null and plan_paz is not null then
      insert into customer_subscriptions (subscription_number, customer_id, plan_id, start_date, next_billing_date, next_shipping_date, cycles_completed, status, notes)
      values ('SUB-0001', customer_igreja, plan_paz, current_date, current_date + interval '30 days', current_date + interval '32 days', 0, 'active', 'Assinatura demonstrativa.')
      on conflict (subscription_number) do nothing;

      select id into subscription_paz from customer_subscriptions where subscription_number = 'SUB-0001';

      if subscription_paz is not null then
        insert into subscription_cycles (subscription_id, cycle_number, billing_date, shipping_date, amount_cents, status, notes)
        values (subscription_paz, 1, current_date + interval '30 days', current_date + interval '32 days', 7990, 'planned', 'Primeiro ciclo demonstrativo.')
        on conflict (subscription_id, cycle_number) do nothing;
      end if;
    end if;
  end if;
end $$;
