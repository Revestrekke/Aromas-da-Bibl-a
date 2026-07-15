create table if not exists produtos (
  id text primary key,
  nome text not null,
  referencia text,
  descricao text,
  tipo text default 'Home Spray',
  notas text[] default '{}',
  volume text default '200 ml',
  custo numeric(10,2) default 0,
  preco numeric(10,2) default 0,
  estoque integer default 0,
  status text default 'Planejado',
  imagem_url text,
  created_at timestamptz default now()
);

create table if not exists clientes (
  id text primary key,
  nome text not null,
  tipo text,
  contato text,
  telefone text,
  email text,
  status text default 'Lead',
  proximo_contato date,
  observacoes text,
  created_at timestamptz default now()
);

create table if not exists pedidos (
  id text primary key,
  cliente text not null,
  produto text not null,
  quantidade integer default 1,
  total numeric(10,2) default 0,
  status text default 'Novo',
  pagamento text default 'Pendente',
  entrega text,
  historico text,
  created_at timestamptz default now()
);

create table if not exists estoque (
  id text primary key,
  item text not null,
  categoria text,
  quantidade numeric(10,2) default 0,
  minimo numeric(10,2) default 0,
  unidade text default 'un',
  fornecedor text,
  created_at timestamptz default now()
);

create table if not exists campanhas (
  id text primary key,
  nome text not null,
  canal text,
  periodo text,
  objetivo text,
  leads integer default 0,
  conversao numeric(5,2) default 0,
  created_at timestamptz default now()
);

create table if not exists financeiro (
  id text primary key,
  mes text not null,
  receita numeric(10,2) default 0,
  custos numeric(10,2) default 0,
  lucro numeric(10,2) default 0,
  pedidos integer default 0,
  created_at timestamptz default now()
);

create table if not exists custos (
  id text primary key,
  item text not null,
  categoria text,
  valor_unitario numeric(10,2) default 0,
  tipo text default 'Variável',
  observacoes text,
  created_at timestamptz default now()
);

alter table produtos enable row level security;
alter table clientes enable row level security;
alter table pedidos enable row level security;
alter table estoque enable row level security;
alter table campanhas enable row level security;
alter table financeiro enable row level security;
alter table custos enable row level security;
