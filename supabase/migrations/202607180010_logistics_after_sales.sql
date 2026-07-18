create table if not exists carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text,
  contact text,
  tracking_url_template text,
  average_delivery_days integer default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  shipment_number text not null unique,
  sales_order_id uuid references sales_orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  carrier_id uuid references carriers(id) on delete set null,
  shipping_method text,
  tracking_code text,
  shipping_cost_cents integer not null default 0,
  charged_shipping_cents integer not null default 0,
  shipped_at date,
  expected_delivery date,
  delivered_at date,
  recipient_name text,
  address text,
  status text not null default 'pending' check (status in ('pending', 'label_ready', 'shipped', 'in_transit', 'delivered', 'delayed', 'returned', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  event_date timestamptz not null default now(),
  status text not null,
  description text not null,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists after_sales_followups (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid references sales_orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  shipment_id uuid references shipments(id) on delete set null,
  followup_date date not null,
  channel text,
  objective text,
  result text,
  next_action text,
  status text not null default 'planned' check (status in ('planned', 'done', 'rescheduled', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_feedback (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid references sales_orders(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  rating integer check (rating between 1 and 5),
  nps integer check (nps between 0 and 10),
  comment text,
  source_channel text,
  feedback_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipments_status on shipments(status, expected_delivery);
create index if not exists idx_shipments_order on shipments(sales_order_id);
create index if not exists idx_shipment_events_shipment on shipment_events(shipment_id, event_date desc);
create index if not exists idx_after_sales_followups_date on after_sales_followups(followup_date, status);
create index if not exists idx_customer_feedback_customer on customer_feedback(customer_id, feedback_date desc);

alter table carriers enable row level security;
alter table shipments enable row level security;
alter table shipment_events enable row level security;
alter table after_sales_followups enable row level security;
alter table customer_feedback enable row level security;

do $$
declare
  order_demo uuid;
  customer_demo uuid;
  carrier_demo uuid;
  shipment_demo uuid;
begin
  select id, customer_id into order_demo, customer_demo from sales_orders where order_number = 'PED-0001' limit 1;

  insert into carriers (name, service_type, contact, tracking_url_template, average_delivery_days)
  values ('Entrega local demonstrativa', 'local', 'WhatsApp interno', 'https://rastreamento.example/{{tracking_code}}', 3)
  on conflict do nothing
  returning id into carrier_demo;

  if carrier_demo is null then
    select id into carrier_demo from carriers where name = 'Entrega local demonstrativa' limit 1;
  end if;

  if order_demo is not null then
    insert into shipments (shipment_number, sales_order_id, customer_id, carrier_id, shipping_method, tracking_code, shipping_cost_cents, charged_shipping_cents, shipped_at, expected_delivery, recipient_name, status, notes)
    values ('ENV-0001', order_demo, customer_demo, carrier_demo, 'Entrega local', 'ADB0001', 2500, 0, current_date, current_date + interval '3 days', 'Igreja Vida Plena', 'shipped', 'Envio demonstrativo.')
    on conflict (shipment_number) do nothing;

    select id into shipment_demo from shipments where shipment_number = 'ENV-0001';

    if shipment_demo is not null then
      insert into shipment_events (shipment_id, status, description, location)
      values
        (shipment_demo, 'shipped', 'Pedido saiu para entrega.', 'Atelie Aromas da Biblia'),
        (shipment_demo, 'in_transit', 'Entrega em andamento.', 'Rota local')
      on conflict do nothing;

      insert into after_sales_followups (sales_order_id, customer_id, shipment_id, followup_date, channel, objective, status)
      values (order_demo, customer_demo, shipment_demo, current_date + interval '5 days', 'WhatsApp', 'Confirmar recebimento e experiencia com o aroma.', 'planned')
      on conflict do nothing;
    end if;
  end if;
end $$;
