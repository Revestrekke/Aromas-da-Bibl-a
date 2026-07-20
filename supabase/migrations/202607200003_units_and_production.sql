alter table public.products add column if not exists unit text not null default 'un';
alter table public.products add column if not exists current_cost_cents numeric(14,6) not null default 0;

alter table public.supplies
  alter column unit_cost_cents type numeric(14,6) using unit_cost_cents::numeric;

alter table public.packaging
  alter column unit_cost_cents type numeric(14,6) using unit_cost_cents::numeric;

alter table public.purchases
  alter column unit_cost_cents type numeric(14,6) using unit_cost_cents::numeric;

alter table public.purchase_items
  alter column unit_cost_cents type numeric(14,6) using unit_cost_cents::numeric;

alter table public.formula_supplies
  alter column unit_cost_cents type numeric(14,6) using unit_cost_cents::numeric;

alter table public.formula_packaging
  alter column unit_cost_cents type numeric(14,6) using unit_cost_cents::numeric;

alter table public.formulas
  alter column unit_cost_total_cents type numeric(14,6) using unit_cost_total_cents::numeric;

create table if not exists public.production_runs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  formula_id uuid not null references public.formulas(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit text not null default 'un',
  total_cost_cents integer not null default 0 check (total_cost_cents >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_production_runs_product on public.production_runs(product_id, created_at desc);
