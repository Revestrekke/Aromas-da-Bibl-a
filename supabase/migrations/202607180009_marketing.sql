create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  objective text,
  channel text,
  audience text,
  start_date date,
  end_date date,
  budget_cents integer not null default 0,
  target_leads integer not null default 0,
  target_revenue_cents integer not null default 0,
  owner text,
  status text not null default 'planned' check (status in ('planned', 'active', 'paused', 'finished', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_content_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete cascade,
  title text not null,
  content_type text not null default 'post' check (content_type in ('post', 'story', 'reel', 'email', 'whatsapp', 'ad', 'landing_page')),
  channel text,
  publish_at timestamptz,
  copy_text text,
  asset_url text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_calendar_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete set null,
  event_date date not null,
  title text not null,
  event_type text not null default 'campaign' check (event_type in ('campaign', 'holiday', 'event', 'content', 'launch')),
  channel text,
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists marketing_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  name text not null,
  contact text,
  source_channel text,
  interest text,
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  estimated_value_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing_results (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing_campaigns(id) on delete cascade,
  result_date date not null default current_date,
  impressions integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  conversions integer not null default 0,
  revenue_cents integer not null default 0,
  spend_cents integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_campaigns_status on marketing_campaigns(status, start_date);
create index if not exists idx_marketing_content_campaign on marketing_content_items(campaign_id, publish_at);
create index if not exists idx_marketing_calendar_date on marketing_calendar_events(event_date);
create index if not exists idx_marketing_leads_campaign_stage on marketing_leads(campaign_id, stage);
create index if not exists idx_marketing_results_campaign on marketing_results(campaign_id, result_date);

alter table marketing_campaigns enable row level security;
alter table marketing_content_items enable row level security;
alter table marketing_calendar_events enable row level security;
alter table marketing_leads enable row level security;
alter table marketing_results enable row level security;

do $$
declare
  campaign_paz uuid;
  customer_igreja uuid;
begin
  select id into customer_igreja from customers where name = 'Igreja Vida Plena' limit 1;

  insert into marketing_campaigns (code, name, objective, channel, audience, start_date, end_date, budget_cents, target_leads, target_revenue_cents, owner, status, notes)
  values ('MKT-PAZ-001', 'Kit Devocional Paz', 'Validar kit presenteavel para igrejas e encontros.', 'Instagram + WhatsApp', 'Igrejas, mulheres, grupos de devocional e presentes cristãos.', current_date, current_date + interval '30 days', 45000, 40, 600000, 'Marketing', 'active', 'Campanha demonstrativa da linha inicial.')
  on conflict (code) do nothing;

  select id into campaign_paz from marketing_campaigns where code = 'MKT-PAZ-001';

  if campaign_paz is not null then
    insert into marketing_content_items (campaign_id, title, content_type, channel, publish_at, copy_text, status)
    values
      (campaign_paz, 'Post de lancamento Home Spray Paz', 'post', 'Instagram', now() + interval '1 day', 'Apresente o Home Spray Paz como aroma para leitura, oração e descanso.', 'scheduled'),
      (campaign_paz, 'Sequencia WhatsApp para igrejas parceiras', 'whatsapp', 'WhatsApp', now() + interval '2 days', 'Mensagem curta para apresentar kit devocional e pedido minimo.', 'draft')
    on conflict do nothing;

    insert into marketing_calendar_events (campaign_id, event_date, title, event_type, channel, status, notes)
    values
      (campaign_paz, current_date + interval '1 day', 'Publicar lancamento Paz', 'content', 'Instagram', 'planned', 'Usar imagem do produto e versiculo Joao 14:27.'),
      (campaign_paz, current_date + interval '7 days', 'Follow-up igrejas', 'campaign', 'WhatsApp', 'planned', 'Retomar leads interessados.')
    on conflict do nothing;

    insert into marketing_leads (campaign_id, customer_id, name, contact, source_channel, interest, stage, estimated_value_cents)
    values (campaign_paz, customer_igreja, 'Igreja Vida Plena', '(00) 90000-0000', 'WhatsApp', 'Kit devocional para evento', 'qualified', 139800)
    on conflict do nothing;

    insert into marketing_results (campaign_id, result_date, impressions, clicks, leads, conversions, revenue_cents, spend_cents, notes)
    values (campaign_paz, current_date, 1200, 86, 8, 1, 139800, 12000, 'Resultado demonstrativo inicial.')
    on conflict do nothing;
  end if;
end $$;
