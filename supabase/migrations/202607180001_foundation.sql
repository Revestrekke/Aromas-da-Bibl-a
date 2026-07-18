create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  action text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (module, action)
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on audit_logs(entity_table, entity_id);
create index if not exists idx_audit_logs_user_created on audit_logs(user_id, created_at desc);
create index if not exists idx_user_roles_user on user_roles(user_id);

insert into roles (slug, name, description) values
  ('admin', 'Administrador', 'Acesso completo ao painel administrativo.'),
  ('financeiro', 'Financeiro', 'Acesso a contas, custos, precificação e relatórios financeiros.'),
  ('comercial', 'Comercial', 'Acesso a clientes, orçamentos, pedidos e CRM.'),
  ('producao', 'Produção', 'Acesso a fórmulas, ordens de produção, lotes e qualidade.'),
  ('estoque', 'Estoque', 'Acesso a insumos, embalagens, inventário e movimentações.'),
  ('consulta', 'Consulta', 'Acesso somente leitura.')
on conflict (slug) do nothing;

insert into permissions (module, action, description) values
  ('dashboard', 'view', 'Visualizar dashboard executivo'),
  ('products', 'manage', 'Criar e editar produtos'),
  ('inventory', 'manage', 'Gerenciar estoque e movimentações'),
  ('finance', 'view', 'Visualizar dados financeiros'),
  ('finance', 'manage', 'Gerenciar financeiro, custos e precificação'),
  ('sales', 'manage', 'Gerenciar orçamentos, pedidos e vendas'),
  ('production', 'manage', 'Gerenciar produção, fórmulas e lotes'),
  ('settings', 'manage', 'Gerenciar configurações do sistema'),
  ('audit', 'view', 'Visualizar trilha de auditoria')
on conflict (module, action) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
cross join permissions p
where r.slug = 'admin'
on conflict do nothing;

insert into settings (key, value, description) values
  ('company', '{"name":"Aromas da Bíblia","timezone":"America/Sao_Paulo","currency":"BRL"}', 'Dados básicos da empresa'),
  ('inventory_rules', '{"allow_negative_stock":false,"default_low_stock_alert":true}', 'Regras gerais de estoque'),
  ('pricing_rules', '{"minimum_margin_percent":45,"default_tax_percent":0}', 'Regras padrão de precificação')
on conflict (key) do nothing;

alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table settings enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "audit_logs_service_role_all" on audit_logs;
create policy "audit_logs_service_role_all" on audit_logs
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "settings_service_role_all" on settings;
create policy "settings_service_role_all" on settings
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
