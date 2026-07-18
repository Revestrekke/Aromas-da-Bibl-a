# Aromas da Bíblia

Sistema web para a marca Aromas da Bíblia.

## Arquitetura Atual

- Site público: `/`
- Painel administrativo: `/admin`
- Backend: Node.js + Express
- Banco/autenticação: Supabase
- Deploy: Render Web Service

O site público é separado do painel administrativo. O painel usa Supabase Auth no navegador e envia o JWT para as APIs protegidas em `/api/admin/*`.

## Tecnologias

- Node.js 20+
- Express
- Supabase JS
- Chart.js
- Lucide Icons
- Helmet
- Express Rate Limit

## Variáveis de Ambiente

Crie um `.env` local ou configure no Render:

```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-somente-no-backend
SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable-publica
SUPABASE_SECRET_KEY=sua-chave-secret-somente-no-backend
```

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` no frontend.

## Instalação Local

```bash
npm install
npm start
```

Verificação:

```bash
npm test
```

## Banco de Dados

As migrations ficam em:

```text
supabase/migrations/
```

Primeira migration:

```text
202607180001_foundation.sql
```

Ela cria:

- `profiles`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `settings`
- `audit_logs`

Também há um schema inicial legado em `supabase-schema.sql` para os módulos já prototipados:

- produtos
- clientes
- pedidos
- estoque
- campanhas
- financeiro
- custos

## Autenticação

1. Crie um usuário no Supabase Auth.
2. Acesse `/admin`.
3. Faça login com e-mail e senha.
4. As chamadas administrativas usam `/api/admin/*` com token Bearer.

## Deploy no Render

Configuração:

```bash
Build Command: npm install
Start Command: npm start
```

Depois de cada push:

```text
Manual Deploy > Deploy latest commit
```

## Fases

### Fase 1 - Fundação

- Separação entre site público e painel administrativo.
- Login Supabase no painel.
- APIs administrativas protegidas.
- Migration de usuários, papéis, permissões, configurações e auditoria.
- Headers seguros e rate limit.

### Próximas Fases

- Produtos completos.
- Aromas e fragrâncias.
- Insumos e embalagens.
- Estoque com movimentações.
- Produção, fórmulas e lotes.
- CRM, orçamentos, pedidos e financeiro.
