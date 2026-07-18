create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text,
  entity_table text,
  entity_id text,
  due_date date,
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved', 'ignored')),
  created_by uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_status_severity on notifications(status, severity);
create index if not exists idx_notifications_entity on notifications(entity_table, entity_id);
create index if not exists idx_notifications_created on notifications(created_at desc);

alter table notifications enable row level security;

do $$
begin
  insert into notifications (type, severity, title, message, entity_table, entity_id, status)
  values
    ('stock_low', 'warning', 'Rotulo Paz abaixo do minimo', 'Item demonstrativo com saldo inferior ao estoque minimo.', 'packaging_items', 'EMB-ROT-PAZ', 'unread'),
    ('accounts_receivable_due', 'info', 'Recebivel proximo do vencimento', 'Verifique contas a receber dos proximos dias.', 'accounts_receivable', null, 'unread'),
    ('production_open', 'info', 'Ordem de producao em aberto', 'Acompanhe ordens planejadas ou em andamento.', 'production_orders', null, 'unread')
  on conflict do nothing;
end $$;
