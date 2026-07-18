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

### Fase 2 - Cadastro e Estoque Inicial

Migration:

```text
supabase/migrations/202607180002_catalog_inventory.sql
```

Ela cria:

- `fragrances`
- `suppliers`
- `products`
- `raw_materials`
- `packaging_items`
- `inventory_locations`
- `inventory_movements`

Também adiciona dados iniciais editáveis para:

- Aromas: Paz, Jardim do Éden, Mansidão
- Produto inicial: Home Spray Paz 200 ml
- Insumos demonstrativos
- Embalagens demonstrativas
- Fornecedor demonstrativo

APIs administrativas:

```text
GET /api/admin/catalog
GET /api/admin/fragrances
GET /api/admin/products
GET /api/admin/raw_materials
GET /api/admin/packaging_items
GET /api/admin/suppliers
GET /api/admin/inventory_movements
```

Telas administrativas já possuem cadastro rápido para:

- Aromas
- Insumos
- Embalagens
- Fornecedores

Os formulários enviam dados para APIs protegidas e exigem usuário autenticado no Supabase Auth.

Movimentação de estoque:

```text
POST /api/admin/inventory/movements
```

Essa rota:

- valida o tipo de item (`product`, `raw_material`, `packaging`);
- calcula saldo anterior e saldo posterior no servidor;
- bloqueia estoque negativo;
- atualiza o saldo do item;
- registra a movimentação;
- grava auditoria quando o Supabase está configurado.

### Fase 3 - Fórmulas e Produção Inicial

Migration:

```text
supabase/migrations/202607180003_formulas_production.sql
```

Ela cria:

- `formulas`
- `formula_versions`
- `formula_items`
- `production_orders`
- `production_order_items`
- `production_losses`

APIs administrativas:

```text
GET /api/admin/production
GET /api/admin/formulas
GET /api/admin/formula_versions
GET /api/admin/formula_items
GET /api/admin/production_orders
POST /api/admin/production_orders
POST /api/admin/production/orders/:id/complete
```

Ao finalizar uma ordem de produção, o backend:

- carrega os itens da fórmula;
- consome insumos e embalagens por movimentação de estoque;
- bloqueia estoque negativo;
- registra entrada de produto acabado;
- atualiza a ordem como finalizada;
- grava auditoria.

### Fase 4 - Comercial Inicial

Migration:

```text
supabase/migrations/202607180004_commercial.sql
```

Ela cria:

- `customers`
- `sales_opportunities`
- `sales_quotes`
- `sales_quote_items`
- `sales_orders`
- `sales_order_items`

APIs administrativas:

```text
GET /api/admin/commercial
GET /api/admin/customers
GET /api/admin/sales_opportunities
GET /api/admin/sales_quotes
GET /api/admin/sales_orders
POST /api/admin/customers
POST /api/admin/sales_opportunities
```

Telas:

- `/admin/clientes`
- `/admin/crm`
- `/admin/orcamentos`
- `/admin/pedidos`

### Fase 5 - Financeiro Inicial

Migration:

```text
supabase/migrations/202607180005_finance.sql
```

Ela cria:

- `financial_categories`
- `cost_centers`
- `bank_accounts`
- `accounts_receivable`
- `accounts_payable`
- `cash_flow_entries`

APIs administrativas:

```text
GET /api/admin/finance
GET /api/admin/accounts_receivable
GET /api/admin/accounts_payable
GET /api/admin/cash_flow_entries
POST /api/admin/accounts_receivable
POST /api/admin/accounts_payable
POST /api/admin/sales/orders/:id/receivable
```

Telas:

- `/admin/receber`
- `/admin/pagar`
- `/admin/caixa`

### Fase 5.1 - DRE e Precificação

APIs administrativas:

```text
GET /api/admin/reports/dre
POST /api/admin/pricing/simulate
```

Telas:

- `/admin/dre`
- `/admin/precificacao`

Os cálculos de DRE e precificação são feitos no backend. A DRE usa pedidos, itens de pedido, contas a pagar e contas a receber. O simulador calcula preço mínimo, preço sugerido, preço revendedor, preço promocional, taxas variáveis, lucro unitário e alertas de margem.

### Fase 5.2 - Relatórios e Exportação CSV

APIs administrativas:

```text
GET /api/admin/reports
GET /api/admin/reports/sales.csv
GET /api/admin/reports/stock.csv
GET /api/admin/reports/customers.csv
GET /api/admin/reports/receivable.csv
GET /api/admin/reports/payable.csv
GET /api/admin/reports/production.csv
```

Tela:

- `/admin/relatorios`

Todos os relatórios são protegidos por autenticação e os CSVs são gerados no backend.

### Fase 5.3 - Notificações e Alertas

Migration:

```text
supabase/migrations/202607180006_notifications.sql
```

Ela cria:

- `notifications`

APIs administrativas:

```text
GET /api/admin/notifications
POST /api/admin/notifications
POST /api/admin/notifications/:id/read
POST /api/admin/notifications/:id/resolve
```

Tela:

- `/admin/notificacoes`

A central combina notificações salvas no Supabase com alertas calculados pelo backend, incluindo estoque baixo, contas a receber ou pagar próximas do vencimento, produções abertas e follow-ups atrasados.

### Fase 5.4 - Administração, Configurações e Auditoria

APIs administrativas:

```text
GET /api/admin/admin-control
GET /api/admin/settings
PUT /api/admin/settings/:key
GET /api/admin/audit-logs
```

Telas:

- `/admin/configuracoes`
- `/admin/usuarios`
- `/admin/auditoria`

Essa fase usa as tabelas da migration de fundação: `profiles`, `roles`, `settings` e `audit_logs`. O painel permite ajustar configurações de empresa, estoque e precificação, visualizar perfis/papéis e acompanhar eventos auditados.

### Fase 5.5 - Qualidade, Lotes e Rastreabilidade

Migration:

```text
supabase/migrations/202607180007_quality_batches.sql
```

Ela cria:

- `product_batches`
- `quality_checks`
- `batch_trace_events`

APIs administrativas:

```text
GET /api/admin/quality
POST /api/admin/product_batches
POST /api/admin/quality_checks
POST /api/admin/batch_trace_events
POST /api/admin/product-batches/:id/status
```

Telas:

- `/admin/lotes`
- `/admin/qualidade`
- `/admin/rastreabilidade`

Ao finalizar uma ordem de produção, o backend também pode gerar automaticamente um lote em quarentena e registrar o primeiro evento de rastreabilidade.

### Fase 5.6 - Compras, Cotações e Reposição

Migration:

```text
supabase/migrations/202607180008_purchasing.sql
```

Ela cria:

- `purchase_requests`
- `purchase_request_items`
- `purchase_quotes`
- `purchase_orders`
- `purchase_order_items`

APIs administrativas:

```text
GET /api/admin/purchasing
POST /api/admin/purchase_requests
POST /api/admin/purchase_request_items
POST /api/admin/purchase_quotes
POST /api/admin/purchase_orders
POST /api/admin/purchase_order_items
POST /api/admin/purchase-orders/:id/receive
```

Telas:

- `/admin/solicitacoes`
- `/admin/cotacoes`
- `/admin/compras`

O recebimento de compra gera entrada de estoque, conta a pagar e lançamento previsto no fluxo de caixa.

### Fase 5.7 - Marketing, Campanhas e Calendário Comercial

Migration:

```text
supabase/migrations/202607180009_marketing.sql
```

Ela cria:

- `marketing_campaigns`
- `marketing_content_items`
- `marketing_calendar_events`
- `marketing_leads`
- `marketing_results`

APIs administrativas:

```text
GET /api/admin/marketing
POST /api/admin/marketing_campaigns
POST /api/admin/marketing_content_items
POST /api/admin/marketing_calendar_events
POST /api/admin/marketing_leads
POST /api/admin/marketing_results
```

Telas:

- `/admin/campanhas`
- `/admin/conteudo`
- `/admin/calendario`
- `/admin/leads-marketing`

Essa fase operacionaliza campanhas, conteúdos, calendário comercial, leads captados e resultados de marketing com orçamento, receita e ROI.

### Fase 5.8 - Entrega, Frete e Pós-venda

Migration:

```text
supabase/migrations/202607180010_logistics_after_sales.sql
```

Ela cria:

- `carriers`
- `shipments`
- `shipment_events`
- `after_sales_followups`
- `customer_feedback`

APIs administrativas:

```text
GET /api/admin/logistics
POST /api/admin/carriers
POST /api/admin/shipments
POST /api/admin/shipment_events
POST /api/admin/after_sales_followups
POST /api/admin/customer_feedback
POST /api/admin/shipments/:id/status
```

Telas:

- `/admin/entregas`
- `/admin/transportadoras`
- `/admin/pos-venda`
- `/admin/feedback`

Essa fase controla remessas, rastreio, transportadoras, custo de frete, status de entrega, follow-ups de pós-venda e avaliação/NPS do cliente.
