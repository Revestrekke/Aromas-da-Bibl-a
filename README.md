# Aromas da Biblia

Sistema web da marca Aromas da Biblia.

## Estrutura

- Site publico preservado em `/`
- Sistema interno protegido em `/admin`
- Backend Node.js + Express em `server.js`
- Banco e autenticacao via Supabase
- Deploy como Render Web Service

## Areas do sistema interno

O painel administrativo foi reduzido para uma gestao simples, sem modulos de ERP:

- Inicio
- Produtos
- Insumos
- Embalagens
- Formulas
- Compras
- Financeiro

Cada item do menu abre uma pagina propria dentro de `/admin`, usando rotas por hash como `/admin#produtos` e `/admin#compras`.

## Variaveis de ambiente

Configure no Render:

```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-somente-no-backend
```

Tambem sao aceitos os aliases:

```env
SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
SUPABASE_SECRET_KEY=sua-chave-secret-somente-no-backend
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_SECRET_KEY` no frontend.

## Render

Use Web Service.

```bash
npm install
npm start
```

Configuracao recomendada:

- Build Command: `npm install`
- Start Command: `npm start`
- Runtime: Node
- Branch: `main`

## Banco de dados

As migrations ficam em:

```text
supabase/migrations/
```

A migration principal desta fase e:

```text
202607200001_simple_internal_system.sql
```

Ela cria ou ajusta as tabelas:

- `products`
- `supplies`
- `packaging`
- `formulas`
- `formula_supplies`
- `formula_packaging`
- `suppliers`
- `purchases`
- `purchase_items`
- `inventory_movements`
- `financial_entries`
- `users`
- `settings`

## Regras implementadas

- Admin protegido por Supabase Auth.
- CRUD com criacao, edicao e exclusao.
- Validacao de campos obrigatorios no backend.
- Valores financeiros salvos em centavos.
- Estoque nao pode ficar negativo.
- Compra nao pode ser salva sem item.
- Formula precisa estar vinculada a produto e ter rendimento maior que zero.
- Compra salva gera entrada de estoque e despesa financeira.
- Edicao de compra reverte o impacto anterior e aplica o novo.
- Exclusao de compra reverte estoque e remove lancamento financeiro vinculado.
- Custos de formula sao calculados no backend.

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Verificacao

```bash
npm run build
npm run lint
npm test
```
