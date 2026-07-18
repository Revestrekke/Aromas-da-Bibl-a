create table if not exists product_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique,
  production_order_id uuid references production_orders(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  formula_version_id uuid references formula_versions(id) on delete set null,
  quantity numeric(12,3) not null default 0,
  unit text not null default 'un',
  manufactured_at date,
  expires_at date,
  status text not null default 'quarantine' check (status in ('quarantine', 'approved', 'rejected', 'released', 'recalled')),
  storage_location text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quality_checks (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references product_batches(id) on delete cascade,
  production_order_id uuid references production_orders(id) on delete set null,
  check_date date not null default current_date,
  inspector text,
  aroma_result text not null default 'pending' check (aroma_result in ('pending', 'approved', 'rejected')),
  label_result text not null default 'pending' check (label_result in ('pending', 'approved', 'rejected')),
  packaging_result text not null default 'pending' check (packaging_result in ('pending', 'approved', 'rejected')),
  leakage_result text not null default 'pending' check (leakage_result in ('pending', 'approved', 'rejected')),
  final_status text not null default 'pending' check (final_status in ('pending', 'approved', 'rejected', 'rework')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists batch_trace_events (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references product_batches(id) on delete cascade,
  event_type text not null,
  description text not null,
  quantity numeric(12,3),
  responsible text,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_batches_status on product_batches(status);
create index if not exists idx_product_batches_product on product_batches(product_id);
create index if not exists idx_quality_checks_batch on quality_checks(batch_id);
create index if not exists idx_batch_trace_events_batch on batch_trace_events(batch_id, created_at desc);

alter table product_batches enable row level security;
alter table quality_checks enable row level security;
alter table batch_trace_events enable row level security;

do $$
declare
  product_paz uuid;
  order_paz uuid;
  version_paz uuid;
  batch_paz uuid;
begin
  select id into product_paz from products where sku = 'ADB-HS-PAZ-200';
  select id into order_paz from production_orders where order_number = 'OP-0001';
  select fv.id into version_paz
  from formula_versions fv
  join formulas f on f.id = fv.formula_id
  where f.code = 'FORM-HS-PAZ-200'
  order by fv.version_number desc
  limit 1;

  if product_paz is not null then
    insert into product_batches (batch_code, production_order_id, product_id, formula_version_id, quantity, manufactured_at, expires_at, status, storage_location, notes)
    values ('LOTE-PAZ-0001', order_paz, product_paz, version_paz, 10, current_date, current_date + interval '12 months', 'quarantine', 'Prateleira A1', 'Lote demonstrativo para rastreabilidade inicial.')
    on conflict (batch_code) do nothing;

    select id into batch_paz from product_batches where batch_code = 'LOTE-PAZ-0001';

    if batch_paz is not null then
      insert into quality_checks (batch_id, production_order_id, inspector, aroma_result, label_result, packaging_result, leakage_result, final_status, notes)
      values (batch_paz, order_paz, 'Qualidade', 'approved', 'approved', 'approved', 'pending', 'pending', 'Aguardando teste final de vazamento.')
      on conflict do nothing;

      insert into batch_trace_events (batch_id, event_type, description, quantity, responsible)
      values
        (batch_paz, 'created', 'Lote criado a partir da ordem de producao OP-0001.', 10, 'Producao'),
        (batch_paz, 'quality_check', 'Inspecao visual e conferencia de rotulo registradas.', 10, 'Qualidade')
      on conflict do nothing;
    end if;
  end if;
end $$;
