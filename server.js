const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

const fallbackData = {
  fragrances: [
    {
      id: 'fragrance-paz',
      code: 'PAZ',
      name: 'Paz',
      concept: 'Serenidade para leitura, oração e descanso.',
      biblical_inspiration: 'João 14:27',
      verse: 'Deixo-vos a paz, a minha paz vos dou.',
      olfactory_family: 'Floral aromático',
      top_notes: ['Lavanda'],
      heart_notes: ['Camomila'],
      base_notes: ['Musk'],
      status: 'active'
    },
    {
      id: 'fragrance-eden',
      code: 'EDEN',
      name: 'Jardim do Éden',
      concept: 'Frescor verde e acolhedor.',
      biblical_inspiration: 'Gênesis 2',
      olfactory_family: 'Verde floral',
      status: 'planned'
    },
    {
      id: 'fragrance-mansidao',
      code: 'MANSIDAO',
      name: 'Mansidão',
      concept: 'Delicadeza, equilíbrio e conforto.',
      biblical_inspiration: 'Mateus 5:5',
      olfactory_family: 'Amadeirado suave',
      status: 'planned'
    }
  ],
  products: [
    {
      id: 'product-paz',
      internal_code: 'PRD-0001',
      sku: 'ADB-HS-PAZ-200',
      name: 'Home Spray Paz 200 ml',
      category: 'Home Spray 200 ml',
      status: 'active',
      current_cost_cents: 3050,
      sale_price_cents: 6990,
      current_stock: 42,
      minimum_stock: 12,
      active_on_site: true
    }
  ],
  raw_materials: [
    { id: 'raw-base', code: 'MP-BASE-HS', name: 'Base para aromatizador', type: 'base', unit: 'ml', quantity_on_hand: 5000, minimum_stock: 1200, current_cost_cents: 8 },
    { id: 'raw-ess-paz', code: 'MP-ESS-PAZ', name: 'Essência Paz', type: 'essência', unit: 'ml', quantity_on_hand: 900, minimum_stock: 300, current_cost_cents: 18 }
  ],
  packaging_items: [
    { id: 'pkg-frasco', code: 'EMB-FRASCO-AMB-200', name: 'Frasco âmbar 200 ml', type: 'frasco', quantity_on_hand: 120, minimum_stock: 40, unit_cost_cents: 520 },
    { id: 'pkg-valvula', code: 'EMB-VALV-PRETA', name: 'Válvula spray preta', type: 'válvula', quantity_on_hand: 95, minimum_stock: 40, unit_cost_cents: 290 },
    { id: 'pkg-rotulo', code: 'EMB-ROT-PAZ', name: 'Rótulo Paz', type: 'rótulo', quantity_on_hand: 34, minimum_stock: 50, unit_cost_cents: 320 }
  ],
  suppliers: [
    { id: 'supplier-demo', trade_name: 'Fornecedor demonstrativo', category: 'Insumos e embalagens', contact_name: 'Contato comercial', status: 'active', rating: 4.5 }
  ],
  purchase_requests: [
    { id: 'pr-001', request_number: 'SC-0001', requester: 'Producao', priority: 'high', reason: 'Reposicao para lote piloto Home Spray Paz.', needed_by: '2026-07-25', status: 'ordered' }
  ],
  purchase_request_items: [
    { id: 'pri-001', purchase_request_id: 'pr-001', item_type: 'raw_material', item_id: 'raw-base', description: 'Base para aromatizador', quantity: 2000, unit: 'ml', estimated_unit_cost_cents: 8 },
    { id: 'pri-002', purchase_request_id: 'pr-001', item_type: 'packaging', item_id: 'pkg-frasco', description: 'Frasco ambar 200 ml', quantity: 50, unit: 'un', estimated_unit_cost_cents: 540 }
  ],
  purchase_quotes: [
    { id: 'pq-001', quote_number: 'COT-0001', purchase_request_id: 'pr-001', supplier_id: 'supplier-demo', quoted_at: '2026-07-18', valid_until: '2026-08-02', freight_cents: 3000, total_cents: 46000, payment_terms: 'Pix ou boleto 7 dias', delivery_days: 5, status: 'approved' }
  ],
  purchase_orders: [
    { id: 'po-001', order_number: 'OC-0001', purchase_request_id: 'pr-001', purchase_quote_id: 'pq-001', supplier_id: 'supplier-demo', order_date: '2026-07-18', expected_date: '2026-07-23', subtotal_cents: 43000, freight_cents: 3000, total_cents: 46000, status: 'sent' }
  ],
  purchase_order_items: [
    { id: 'poi-001', purchase_order_id: 'po-001', item_type: 'raw_material', item_id: 'raw-base', description: 'Base para aromatizador', quantity: 2000, received_quantity: 0, unit: 'ml', unit_cost_cents: 8, total_cents: 16000 },
    { id: 'poi-002', purchase_order_id: 'po-001', item_type: 'packaging', item_id: 'pkg-frasco', description: 'Frasco ambar 200 ml', quantity: 50, received_quantity: 0, unit: 'un', unit_cost_cents: 540, total_cents: 27000 }
  ],
  inventory_movements: [
    { id: 'mov-001', item_type: 'product', item_id: 'product-paz', movement_type: 'in', origin: 'seed', quantity: 42, quantity_after: 42, unit_cost_cents: 3050 }
  ],
  formulas: [
    { id: 'formula-paz', code: 'FORM-HS-PAZ-200', name: 'Home Spray Paz 200 ml', product_id: 'product-paz', status: 'testing' }
  ],
  formula_versions: [
    { id: 'formula-version-paz-v1', formula_id: 'formula-paz', version_number: 1, planned_yield: 10, yield_unit: 'un', loss_percent: 3, status: 'draft' }
  ],
  formula_items: [
    { id: 'formula-item-base', formula_version_id: 'formula-version-paz-v1', item_type: 'raw_material', item_id: 'raw-base', quantity: 1800, unit: 'ml', sort_order: 1 },
    { id: 'formula-item-essence', formula_version_id: 'formula-version-paz-v1', item_type: 'raw_material', item_id: 'raw-ess-paz', quantity: 200, unit: 'ml', sort_order: 2 },
    { id: 'formula-item-bottle', formula_version_id: 'formula-version-paz-v1', item_type: 'packaging', item_id: 'pkg-frasco', quantity: 10, unit: 'un', sort_order: 3 },
    { id: 'formula-item-valve', formula_version_id: 'formula-version-paz-v1', item_type: 'packaging', item_id: 'pkg-valvula', quantity: 10, unit: 'un', sort_order: 4 },
    { id: 'formula-item-label', formula_version_id: 'formula-version-paz-v1', item_type: 'packaging', item_id: 'pkg-rotulo', quantity: 10, unit: 'un', sort_order: 5 }
  ],
  production_orders: [
    { id: 'op-001', order_number: 'OP-0001', product_id: 'product-paz', formula_id: 'formula-paz', formula_version_id: 'formula-version-paz-v1', planned_quantity: 10, status: 'planned', responsible: 'Produção' }
  ],
  product_batches: [
    { id: 'batch-paz-0001', batch_code: 'LOTE-PAZ-0001', production_order_id: 'op-001', product_id: 'product-paz', formula_version_id: 'formula-version-paz-v1', quantity: 10, unit: 'un', manufactured_at: '2026-07-18', expires_at: '2027-07-18', status: 'quarantine', storage_location: 'Prateleira A1', notes: 'Lote demonstrativo para rastreabilidade inicial.' }
  ],
  quality_checks: [
    { id: 'qc-paz-0001', batch_id: 'batch-paz-0001', production_order_id: 'op-001', check_date: '2026-07-18', inspector: 'Qualidade', aroma_result: 'approved', label_result: 'approved', packaging_result: 'approved', leakage_result: 'pending', final_status: 'pending', notes: 'Aguardando teste final de vazamento.' }
  ],
  batch_trace_events: [
    { id: 'trace-paz-created', batch_id: 'batch-paz-0001', event_type: 'created', description: 'Lote criado a partir da ordem de producao OP-0001.', quantity: 10, responsible: 'Producao', created_at: '2026-07-18T12:00:00Z' },
    { id: 'trace-paz-qc', batch_id: 'batch-paz-0001', event_type: 'quality_check', description: 'Inspecao visual e conferencia de rotulo registradas.', quantity: 10, responsible: 'Qualidade', created_at: '2026-07-18T13:00:00Z' }
  ],
  customers: [
    { id: 'customer-igreja', person_type: 'company', name: 'Igreja Vida Plena', whatsapp: '(00) 90000-0000', email: 'contato@vidaplena.example', type: 'church', status: 'lead', acquisition_channel: 'WhatsApp' },
    { id: 'customer-livraria', person_type: 'company', name: 'Livraria Caminho', whatsapp: '(00) 91111-1111', email: 'compras@livrariacaminho.example', type: 'reseller', status: 'active', acquisition_channel: 'Instagram' }
  ],
  sales_opportunities: [
    { id: 'opp-001', customer_id: 'customer-igreja', title: 'Kit devocional para encontro de mulheres', estimated_value_cents: 139800, quantity: 20, stage: 'interest_identified', probability_percent: 65, next_action: 'Enviar orçamento formal' },
    { id: 'opp-002', customer_id: 'customer-livraria', title: 'Revenda linha Aromas da Bíblia', estimated_value_cents: 349500, quantity: 50, stage: 'negotiation', probability_percent: 55, next_action: 'Negociar tabela de revenda' }
  ],
  sales_quotes: [
    { id: 'quote-001', quote_number: 'ORC-0001', customer_id: 'customer-igreja', channel: 'WhatsApp', subtotal_cents: 139800, total_cents: 139800, status: 'sent', seller: 'Comercial' }
  ],
  sales_quote_items: [
    { id: 'quote-item-001', quote_id: 'quote-001', product_id: 'product-paz', description: 'Home Spray Paz 200 ml', quantity: 20, unit_price_cents: 6990, total_cents: 139800 }
  ],
  sales_orders: [
    { id: 'order-001', order_number: 'PED-0001', quote_id: 'quote-001', customer_id: 'customer-igreja', channel: 'WhatsApp', subtotal_cents: 139800, total_cents: 139800, payment_status: 'pending', status: 'awaiting_payment' }
  ],
  marketing_campaigns: [
    { id: 'mkt-paz-001', code: 'MKT-PAZ-001', name: 'Kit Devocional Paz', objective: 'Validar kit presenteavel para igrejas e encontros.', channel: 'Instagram + WhatsApp', audience: 'Igrejas, mulheres, grupos de devocional e presentes cristaos.', start_date: '2026-07-18', end_date: '2026-08-17', budget_cents: 45000, target_leads: 40, target_revenue_cents: 600000, owner: 'Marketing', status: 'active' }
  ],
  marketing_content_items: [
    { id: 'mkt-content-001', campaign_id: 'mkt-paz-001', title: 'Post de lancamento Home Spray Paz', content_type: 'post', channel: 'Instagram', publish_at: '2026-07-19T12:00:00Z', status: 'scheduled' },
    { id: 'mkt-content-002', campaign_id: 'mkt-paz-001', title: 'Sequencia WhatsApp para igrejas parceiras', content_type: 'whatsapp', channel: 'WhatsApp', publish_at: '2026-07-20T12:00:00Z', status: 'draft' }
  ],
  marketing_calendar_events: [
    { id: 'mkt-cal-001', campaign_id: 'mkt-paz-001', event_date: '2026-07-19', title: 'Publicar lancamento Paz', event_type: 'content', channel: 'Instagram', status: 'planned' },
    { id: 'mkt-cal-002', campaign_id: 'mkt-paz-001', event_date: '2026-07-25', title: 'Follow-up igrejas', event_type: 'campaign', channel: 'WhatsApp', status: 'planned' }
  ],
  marketing_leads: [
    { id: 'mkt-lead-001', campaign_id: 'mkt-paz-001', customer_id: 'customer-igreja', name: 'Igreja Vida Plena', contact: '(00) 90000-0000', source_channel: 'WhatsApp', interest: 'Kit devocional para evento', stage: 'qualified', estimated_value_cents: 139800 }
  ],
  marketing_results: [
    { id: 'mkt-result-001', campaign_id: 'mkt-paz-001', result_date: '2026-07-18', impressions: 1200, clicks: 86, leads: 8, conversions: 1, revenue_cents: 139800, spend_cents: 12000 }
  ],
  sales_order_items: [
    { id: 'order-item-001', order_id: 'order-001', product_id: 'product-paz', description: 'Home Spray Paz 200 ml', quantity: 20, unit_price_cents: 6990, total_cents: 139800, unit_cost_cents: 3050, margin_cents: 78800 }
  ],
  product_kits: [
    { id: 'kit-paz-devocional', code: 'KIT-PAZ-DEV-01', name: 'Kit Devocional Paz', description: 'Kit demonstrativo com Home Spray Paz e embalagem presenteavel.', audience: 'Igrejas, grupos de leitura e presentes cristaos.', occasion: 'Encontros, visitas e devocionais.', sale_price_cents: 8990, cost_cents: 4200, margin_cents: 4790, active: true }
  ],
  product_kit_items: [
    { id: 'kit-item-paz-spray', kit_id: 'kit-paz-devocional', product_id: 'product-paz', description: 'Home Spray Paz 200 ml', quantity: 1, unit_cost_cents: 3050, unit_price_cents: 6990, sort_order: 1 },
    { id: 'kit-item-paz-presente', kit_id: 'kit-paz-devocional', product_id: null, description: 'Embalagem presenteavel e cartao devocional', quantity: 1, unit_cost_cents: 1150, unit_price_cents: 2000, sort_order: 2 }
  ],
  subscription_plans: [
    { id: 'plan-paz-mensal', code: 'ASS-PAZ-MENSAL', name: 'Assinatura Paz Mensal', description: 'Envio mensal de aroma e mensagem devocional.', frequency: 'monthly', price_cents: 7990, setup_fee_cents: 0, kit_id: 'kit-paz-devocional', minimum_cycles: 3, active: true }
  ],
  customer_subscriptions: [
    { id: 'sub-001', subscription_number: 'SUB-0001', customer_id: 'customer-igreja', plan_id: 'plan-paz-mensal', start_date: '2026-07-18', next_billing_date: '2026-08-17', next_shipping_date: '2026-08-19', cycles_completed: 0, status: 'active', notes: 'Assinatura demonstrativa.' }
  ],
  subscription_cycles: [
    { id: 'sub-cycle-001', subscription_id: 'sub-001', cycle_number: 1, billing_date: '2026-08-17', shipping_date: '2026-08-19', amount_cents: 7990, status: 'planned', notes: 'Primeiro ciclo demonstrativo.' }
  ],
  carriers: [
    { id: 'carrier-local', name: 'Entrega local demonstrativa', service_type: 'local', contact: 'WhatsApp interno', tracking_url_template: 'https://rastreamento.example/{{tracking_code}}', average_delivery_days: 3, active: true }
  ],
  shipments: [
    { id: 'shipment-001', shipment_number: 'ENV-0001', sales_order_id: 'order-001', customer_id: 'customer-igreja', carrier_id: 'carrier-local', shipping_method: 'Entrega local', tracking_code: 'ADB0001', shipping_cost_cents: 2500, charged_shipping_cents: 0, shipped_at: '2026-07-18', expected_delivery: '2026-07-21', recipient_name: 'Igreja Vida Plena', status: 'shipped', notes: 'Envio demonstrativo.' }
  ],
  shipment_events: [
    { id: 'ship-event-001', shipment_id: 'shipment-001', event_date: '2026-07-18T12:00:00Z', status: 'shipped', description: 'Pedido saiu para entrega.', location: 'Atelie Aromas da Biblia' },
    { id: 'ship-event-002', shipment_id: 'shipment-001', event_date: '2026-07-18T16:00:00Z', status: 'in_transit', description: 'Entrega em andamento.', location: 'Rota local' }
  ],
  after_sales_followups: [
    { id: 'after-sales-001', sales_order_id: 'order-001', customer_id: 'customer-igreja', shipment_id: 'shipment-001', followup_date: '2026-07-23', channel: 'WhatsApp', objective: 'Confirmar recebimento e experiencia com o aroma.', status: 'planned' }
  ],
  customer_feedback: [
    { id: 'feedback-001', sales_order_id: 'order-001', customer_id: 'customer-igreja', rating: 5, nps: 9, comment: 'Produto demonstrativo com excelente proposta.', source_channel: 'WhatsApp', feedback_date: '2026-07-24' }
  ],
  financial_categories: [
    { id: 'cat-sales', name: 'Venda de produtos', type: 'revenue', active: true },
    { id: 'cat-supplies', name: 'Compra de insumos', type: 'expense', active: true },
    { id: 'cat-packaging', name: 'Embalagens', type: 'expense', active: true }
  ],
  cost_centers: [
    { id: 'cc-general', code: 'GERAL', name: 'Geral', active: true },
    { id: 'cc-prod', code: 'PROD', name: 'Produção', active: true },
    { id: 'cc-com', code: 'COM', name: 'Comercial', active: true }
  ],
  bank_accounts: [
    { id: 'bank-main', name: 'Conta principal', bank_name: 'Banco demonstrativo', current_balance_cents: 0, active: true }
  ],
  accounts_receivable: [
    { id: 'ar-001', customer_id: 'customer-igreja', sales_order_id: 'order-001', description: 'Pedido PED-0001 - Home Spray Paz', due_date: '2026-07-25', gross_amount_cents: 139800, net_amount_cents: 139800, status: 'pending' }
  ],
  accounts_payable: [
    { id: 'ap-001', supplier_id: 'supplier-demo', description: 'Compra demonstrativa de frascos e insumos', due_date: '2026-07-28', amount_cents: 85000, net_amount_cents: 85000, status: 'pending' }
  ],
  cash_flow_entries: [
    { id: 'cf-001', entry_date: '2026-07-25', source_type: 'receivable', source_id: 'ar-001', direction: 'in', description: 'Pedido PED-0001 - Home Spray Paz', amount_cents: 139800, status: 'planned' },
    { id: 'cf-002', entry_date: '2026-07-28', source_type: 'payable', source_id: 'ap-001', direction: 'out', description: 'Compra demonstrativa de frascos e insumos', amount_cents: 85000, status: 'planned' }
  ],
  notifications: [
    { id: 'notif-stock-label', type: 'stock_low', severity: 'warning', title: 'Rótulo Paz abaixo do mínimo', message: 'Item demonstrativo com saldo inferior ao estoque mínimo.', entity_table: 'packaging_items', entity_id: 'pkg-rotulo', status: 'unread' },
    { id: 'notif-production-open', type: 'production_open', severity: 'info', title: 'Ordem de produção em aberto', message: 'Há ordem planejada aguardando execução.', entity_table: 'production_orders', entity_id: 'op-001', status: 'unread' }
  ],
  profiles: [
    { id: '00000000-0000-0000-0000-000000000001', full_name: 'Administrador Aromas', email: 'admin@aromasdabiblia.com', status: 'active', last_login_at: '2026-07-18T12:00:00Z' }
  ],
  roles: [
    { id: 'role-admin', slug: 'admin', name: 'Administrador', description: 'Acesso completo ao painel administrativo.' },
    { id: 'role-financeiro', slug: 'financeiro', name: 'Financeiro', description: 'Acesso a contas, custos e precificacao.' },
    { id: 'role-comercial', slug: 'comercial', name: 'Comercial', description: 'Acesso a clientes, pedidos e CRM.' },
    { id: 'role-producao', slug: 'producao', name: 'Producao', description: 'Acesso a formulas, producao e qualidade.' }
  ],
  settings: [
    { id: 'setting-company', key: 'company', value: { name: 'Aromas da Biblia', timezone: 'America/Sao_Paulo', currency: 'BRL' }, description: 'Dados basicos da empresa' },
    { id: 'setting-inventory', key: 'inventory_rules', value: { allow_negative_stock: false, default_low_stock_alert: true }, description: 'Regras gerais de estoque' },
    { id: 'setting-pricing', key: 'pricing_rules', value: { minimum_margin_percent: 45, default_tax_percent: 0 }, description: 'Regras padrao de precificacao' }
  ],
  audit_logs: [
    { id: 'audit-demo-001', user_id: '00000000-0000-0000-0000-000000000001', action: 'create', entity_table: 'products', entity_id: 'product-paz-spray', created_at: '2026-07-18T12:00:00Z' },
    { id: 'audit-demo-002', user_id: '00000000-0000-0000-0000-000000000001', action: 'resolved', entity_table: 'notifications', entity_id: 'notif-stock-label', created_at: '2026-07-18T12:15:00Z' }
  ],
  produtos: [
    {
      id: 'paz-home-spray',
      nome: 'Paz',
      referencia: 'João 14:27',
      descricao: 'Home spray para momentos de leitura, oração e descanso.',
      tipo: 'Home Spray',
      notas: ['Lavanda', 'Camomila', 'Musk'],
      volume: '200 ml',
      custo: 26.5,
      preco: 69.9,
      estoque: 42,
      status: 'Protótipo'
    },
    {
      id: 'graca-home-spray',
      nome: 'Graça',
      referencia: '2 Coríntios 12:9',
      descricao: 'Fragrância floral suave para kits e presentes.',
      tipo: 'Home Spray',
      notas: ['Flor de algodão', 'Baunilha', 'Âmbar'],
      volume: '200 ml',
      custo: 25.8,
      preco: 69.9,
      estoque: 18,
      status: 'Planejado'
    }
  ],
  clientes: [
    {
      id: 'cliente-001',
      nome: 'Igreja Vida Plena',
      tipo: 'Igreja',
      contato: 'WhatsApp',
      telefone: '(00) 90000-0000',
      status: 'Lead quente',
      proximo_contato: '2026-07-22'
    },
    {
      id: 'cliente-002',
      nome: 'Livraria Caminho',
      tipo: 'Revendedor',
      contato: 'Instagram',
      telefone: '(00) 91111-1111',
      status: 'Proposta enviada',
      proximo_contato: '2026-07-25'
    }
  ],
  pedidos: [
    {
      id: 'PED-1001',
      cliente: 'Igreja Vida Plena',
      produto: 'Paz',
      quantidade: 12,
      total: 838.8,
      status: 'Em negociação',
      pagamento: 'Pendente',
      entrega: 'Retirada'
    },
    {
      id: 'PED-1002',
      cliente: 'Cliente direto',
      produto: 'Paz',
      quantidade: 2,
      total: 139.8,
      status: 'Separado',
      pagamento: 'Pago',
      entrega: 'Correios'
    }
  ],
  estoque: [
    { id: 'insumo-001', item: 'Frasco âmbar 200 ml', categoria: 'Embalagem', quantidade: 120, minimo: 40, unidade: 'un' },
    { id: 'insumo-002', item: 'Válvula gatilho preta', categoria: 'Embalagem', quantidade: 95, minimo: 40, unidade: 'un' },
    { id: 'insumo-003', item: 'Essência lavanda', categoria: 'Essência', quantidade: 800, minimo: 300, unidade: 'ml' },
    { id: 'insumo-004', item: 'Rótulo Paz', categoria: 'Rótulo', quantidade: 34, minimo: 50, unidade: 'un' }
  ],
  campanhas: [
    {
      id: 'campanha-001',
      nome: 'Kit Devocional Paz',
      canal: 'Instagram + WhatsApp',
      periodo: 'Agosto',
      objetivo: 'Validar kits presenteáveis',
      leads: 48,
      conversao: 18
    },
    {
      id: 'campanha-002',
      nome: 'Revenda em igrejas',
      canal: 'Parcerias',
      periodo: 'Setembro',
      objetivo: 'Fechar 3 pontos de revenda',
      leads: 12,
      conversao: 25
    }
  ],
  financeiro: [
    { id: 'fin-001', mes: 'Julho', receita: 6800, custos: 2584, lucro: 4216, pedidos: 97 },
    { id: 'fin-002', mes: 'Agosto', receita: 9200, custos: 3496, lucro: 5704, pedidos: 132 },
    { id: 'fin-003', mes: 'Setembro', receita: 12400, custos: 4712, lucro: 7688, pedidos: 177 }
  ],
  custos: [
    { id: 'custo-001', item: 'Base para home spray', categoria: 'Matéria-prima', valor_unitario: 8.4, tipo: 'Variável' },
    { id: 'custo-002', item: 'Essência lavanda/camomila/musk', categoria: 'Fragrância', valor_unitario: 6.8, tipo: 'Variável' },
    { id: 'custo-003', item: 'Frasco âmbar 200 ml', categoria: 'Embalagem', valor_unitario: 5.2, tipo: 'Variável' },
    { id: 'custo-004', item: 'Válvula gatilho preta', categoria: 'Embalagem', valor_unitario: 2.9, tipo: 'Variável' },
    { id: 'custo-005', item: 'Rótulo e acabamento', categoria: 'Identidade visual', valor_unitario: 3.2, tipo: 'Variável' },
    { id: 'custo-006', item: 'Reserva operacional', categoria: 'Operação', valor_unitario: 4.0, tipo: 'Rateio' }
  ]
};

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

async function requireAdminAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase não configurado para autenticação.' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Sessão administrativa ausente.' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  req.user = data.user;
  next();
}

function normalizeId(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function publicError(error) {
  if (!error) return null;
  return {
    message: error.message,
    hint: error.hint || null,
    code: error.code || null
  };
}

const tableValidation = {
  fragrances: {
    required: ['code', 'name'],
    numeric: ['intensity', 'cost_per_liter_cents']
  },
  products: {
    required: ['internal_code', 'sku', 'name', 'category'],
    numeric: ['current_cost_cents', 'sale_price_cents', 'reseller_price_cents', 'minimum_price_cents', 'desired_margin_percent', 'current_stock', 'minimum_stock', 'maximum_stock', 'volume']
  },
  raw_materials: {
    required: ['code', 'name', 'type', 'unit'],
    numeric: ['current_cost_cents', 'average_cost_cents', 'quantity_on_hand', 'minimum_stock', 'maximum_stock']
  },
  packaging_items: {
    required: ['code', 'name', 'type'],
    numeric: ['unit_cost_cents', 'minimum_purchase_quantity', 'lead_time_days', 'quantity_on_hand', 'minimum_stock']
  },
  suppliers: {
    required: ['trade_name'],
    numeric: ['average_lead_time_days', 'minimum_order_cents', 'rating']
  },
  purchase_requests: {
    required: ['request_number'],
    numeric: []
  },
  purchase_request_items: {
    required: ['purchase_request_id', 'item_type', 'item_id', 'quantity'],
    numeric: ['quantity', 'estimated_unit_cost_cents']
  },
  purchase_quotes: {
    required: ['quote_number'],
    numeric: ['freight_cents', 'discount_cents', 'total_cents', 'delivery_days']
  },
  purchase_orders: {
    required: ['order_number'],
    numeric: ['subtotal_cents', 'freight_cents', 'discount_cents', 'total_cents']
  },
  purchase_order_items: {
    required: ['purchase_order_id', 'item_type', 'item_id', 'quantity'],
    numeric: ['quantity', 'received_quantity', 'unit_cost_cents', 'total_cents']
  },
  inventory_movements: {
    required: ['item_type', 'item_id', 'movement_type', 'quantity'],
    numeric: ['quantity', 'quantity_before', 'quantity_after', 'unit_cost_cents']
  },
  formulas: {
    required: ['code', 'name'],
    numeric: []
  },
  formula_versions: {
    required: ['formula_id', 'version_number', 'planned_yield'],
    numeric: ['version_number', 'planned_yield', 'loss_percent']
  },
  formula_items: {
    required: ['formula_version_id', 'item_type', 'item_id', 'quantity'],
    numeric: ['quantity', 'percentage', 'cost_cents', 'sort_order']
  },
  production_orders: {
    required: ['order_number', 'product_id', 'planned_quantity'],
    numeric: ['planned_quantity', 'produced_quantity', 'approved_quantity', 'lost_quantity', 'estimated_cost_cents', 'real_cost_cents']
  },
  product_batches: {
    required: ['batch_code', 'product_id', 'quantity'],
    numeric: ['quantity']
  },
  quality_checks: {
    required: ['batch_id'],
    numeric: []
  },
  batch_trace_events: {
    required: ['batch_id', 'event_type', 'description'],
    numeric: ['quantity']
  },
  customers: {
    required: ['name'],
    numeric: []
  },
  sales_opportunities: {
    required: ['title', 'stage'],
    numeric: ['estimated_value_cents', 'quantity', 'probability_percent']
  },
  sales_quotes: {
    required: ['quote_number'],
    numeric: ['subtotal_cents', 'discount_cents', 'freight_cents', 'total_cents']
  },
  sales_quote_items: {
    required: ['quote_id', 'description', 'quantity'],
    numeric: ['quantity', 'unit_price_cents', 'discount_cents', 'total_cents']
  },
  sales_orders: {
    required: ['order_number'],
    numeric: ['subtotal_cents', 'discount_cents', 'freight_cents', 'total_cents']
  },
  marketing_campaigns: {
    required: ['code', 'name'],
    numeric: ['budget_cents', 'target_leads', 'target_revenue_cents']
  },
  marketing_content_items: {
    required: ['title'],
    numeric: []
  },
  marketing_calendar_events: {
    required: ['event_date', 'title'],
    numeric: []
  },
  marketing_leads: {
    required: ['name'],
    numeric: ['estimated_value_cents']
  },
  marketing_results: {
    required: ['campaign_id'],
    numeric: ['impressions', 'clicks', 'leads', 'conversions', 'revenue_cents', 'spend_cents']
  },
  sales_order_items: {
    required: ['order_id', 'description', 'quantity'],
    numeric: ['quantity', 'unit_price_cents', 'discount_cents', 'total_cents', 'unit_cost_cents', 'margin_cents']
  },
  product_kits: {
    required: ['code', 'name'],
    numeric: ['sale_price_cents', 'cost_cents', 'margin_cents']
  },
  product_kit_items: {
    required: ['kit_id', 'description', 'quantity'],
    numeric: ['quantity', 'unit_cost_cents', 'unit_price_cents', 'sort_order']
  },
  subscription_plans: {
    required: ['code', 'name'],
    numeric: ['price_cents', 'setup_fee_cents', 'minimum_cycles']
  },
  customer_subscriptions: {
    required: ['subscription_number'],
    numeric: ['cycles_completed']
  },
  subscription_cycles: {
    required: ['subscription_id', 'cycle_number', 'billing_date'],
    numeric: ['cycle_number', 'amount_cents']
  },
  carriers: {
    required: ['name'],
    numeric: ['average_delivery_days']
  },
  shipments: {
    required: ['shipment_number'],
    numeric: ['shipping_cost_cents', 'charged_shipping_cents']
  },
  shipment_events: {
    required: ['shipment_id', 'status', 'description'],
    numeric: []
  },
  after_sales_followups: {
    required: ['followup_date'],
    numeric: []
  },
  customer_feedback: {
    required: ['customer_id'],
    numeric: ['rating', 'nps']
  },
  financial_categories: {
    required: ['name', 'type'],
    numeric: []
  },
  cost_centers: {
    required: ['code', 'name'],
    numeric: []
  },
  bank_accounts: {
    required: ['name'],
    numeric: ['opening_balance_cents', 'current_balance_cents']
  },
  accounts_receivable: {
    required: ['description', 'due_date'],
    numeric: ['installment_number', 'gross_amount_cents', 'fee_cents', 'net_amount_cents']
  },
  accounts_payable: {
    required: ['description', 'due_date'],
    numeric: ['amount_cents', 'interest_cents', 'fine_cents', 'discount_cents', 'net_amount_cents', 'installment_number']
  },
  cash_flow_entries: {
    required: ['entry_date', 'source_type', 'direction', 'description'],
    numeric: ['amount_cents']
  },
  notifications: {
    required: ['type', 'title'],
    numeric: []
  },
  settings: {
    required: ['key'],
    numeric: []
  },
  produtos: {
    required: ['nome'],
    numeric: ['custo', 'preco', 'estoque']
  }
};

function validatePayload(table, payload) {
  const rules = tableValidation[table];
  if (!rules) return { ok: true, payload };

  const clean = { ...payload };
  const missing = rules.required.filter((field) => !String(clean[field] ?? '').trim());

  if (missing.length) {
    return {
      ok: false,
      status: 400,
      error: `Campos obrigatórios ausentes: ${missing.join(', ')}.`
    };
  }

  for (const field of rules.numeric || []) {
    if (clean[field] === '' || clean[field] === null || clean[field] === undefined) continue;
    const value = Number(clean[field]);
    if (Number.isNaN(value)) {
      return {
        ok: false,
        status: 400,
        error: `Campo numérico inválido: ${field}.`
      };
    }
    clean[field] = value;
  }

  return { ok: true, payload: clean };
}

async function listTable(table, order = 'created_at') {
  if (!supabase) {
    return { data: fallbackData[table] || [], source: 'fallback' };
  }

  let query = supabase.from(table).select('*');
  if (order) query = query.order(order, { ascending: false });
  const { data, error } = await query;

  if (error) {
    return { data: fallbackData[table] || [], source: 'fallback', supabaseError: publicError(error) };
  }

  return { data, source: 'supabase' };
}

async function writeAuditLog({ user, action, table, recordId, before = null, after = null }) {
  if (!supabase || table === 'audit_logs') return;

  await supabase.from('audit_logs').insert({
    user_id: user?.id || null,
    action,
    entity_table: table,
    entity_id: recordId || null,
    old_value: before,
    new_value: after
  });
}

async function insertIntoTable(table, payload, user = null) {
  const validation = validatePayload(table, payload);
  if (!validation.ok) {
    return { validationError: validation };
  }

  const record = {
    id: validation.payload.id || normalizeId(validation.payload.nome || validation.payload.name || validation.payload.item || validation.payload.cliente || validation.payload.trade_name || randomUUID()),
    ...validation.payload
  };

  if (!supabase) {
    return { data: record, source: 'fallback' };
  }

  const { data, error } = await supabase.from(table).insert(record).select('*').single();
  if (error) {
    return { data: record, source: 'fallback', supabaseError: publicError(error) };
  }

  await writeAuditLog({
    user,
    action: 'create',
    table,
    recordId: data.id,
    after: data
  });

  return { data, source: 'supabase' };
}

async function updateNotificationStatus(id, status, user = null) {
  if (!['read', 'resolved', 'ignored'].includes(status)) {
    return { validationError: { status: 400, error: 'Status de notificacao invalido.' } };
  }

  const patch = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'resolved') {
    patch.resolved_by = user?.id || null;
    patch.resolved_at = new Date().toISOString();
  }

  if (!supabase) {
    return {
      data: { id, ...patch },
      source: 'fallback',
      message: 'Aplique a migration de notificacoes no Supabase para persistir a alteracao.'
    };
  }

  const { data: before } = await supabase.from('notifications').select('*').eq('id', id).maybeSingle();
  const { data, error } = await supabase.from('notifications').update(patch).eq('id', id).select('*').single();

  if (error) {
    return { validationError: { status: 404, error: publicError(error) } };
  }

  await writeAuditLog({
    user,
    action: status,
    table: 'notifications',
    recordId: id,
    before,
    after: data
  });

  return { data, source: 'supabase' };
}

async function upsertSetting(key, payload, user = null) {
  const value = payload?.value && typeof payload.value === 'object' ? payload.value : {};
  const description = payload?.description || null;
  const record = {
    key,
    value,
    description,
    updated_at: new Date().toISOString()
  };

  if (!supabase) {
    return {
      data: { id: normalizeId(`setting-${key}`), ...record },
      source: 'fallback',
      message: 'Aplique as migrations no Supabase para persistir configuracoes.'
    };
  }

  const { data: before } = await supabase.from('settings').select('*').eq('key', key).maybeSingle();
  const { data, error } = await supabase
    .from('settings')
    .upsert(record, { onConflict: 'key' })
    .select('*')
    .single();

  if (error) {
    return { validationError: { status: 400, error: publicError(error) } };
  }

  await writeAuditLog({
    user,
    action: before ? 'update' : 'create',
    table: 'settings',
    recordId: data.id,
    before,
    after: data
  });

  return { data, source: 'supabase' };
}

async function buildAdminControl() {
  const [profiles, roles, settings, auditLogs] = await Promise.all([
    listTable('profiles', 'created_at'),
    listTable('roles', 'created_at'),
    listTable('settings', 'updated_at'),
    listTable('audit_logs', 'created_at')
  ]);

  return {
    source: settings.source,
    metrics: {
      users: profiles.data.length,
      roles: roles.data.length,
      settings: settings.data.length,
      auditLogs: auditLogs.data.length
    },
    profiles,
    roles,
    settings,
    auditLogs
  };
}

async function buildQualityData() {
  const [batches, qualityChecks, traceEvents, productionOrders, products] = await Promise.all([
    listTable('product_batches', 'created_at'),
    listTable('quality_checks', 'created_at'),
    listTable('batch_trace_events', 'created_at'),
    listTable('production_orders', 'created_at'),
    listTable('products', 'created_at')
  ]);

  const batchRows = batches.data || [];
  const checkRows = qualityChecks.data || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    source: batches.source,
    metrics: {
      batches: batchRows.length,
      quarantine: batchRows.filter((item) => item.status === 'quarantine').length,
      approved: batchRows.filter((item) => ['approved', 'released'].includes(item.status)).length,
      rejected: batchRows.filter((item) => item.status === 'rejected').length,
      pendingChecks: checkRows.filter((item) => ['pending', 'rework'].includes(item.final_status)).length,
      expiringSoon: batchRows.filter((item) => {
        const days = daysFromToday(item.expires_at);
        return days !== null && days >= 0 && days <= 60;
      }).length,
      expired: batchRows.filter((item) => {
        const expiresAt = item.expires_at ? new Date(item.expires_at) : null;
        return expiresAt && expiresAt < today;
      }).length
    },
    batches,
    qualityChecks,
    traceEvents,
    productionOrders,
    products
  };
}

function stockColumnForItemType(itemType) {
  if (itemType === 'product') return { table: 'products', stockColumn: 'current_stock' };
  if (itemType === 'raw_material') return { table: 'raw_materials', stockColumn: 'quantity_on_hand' };
  if (itemType === 'packaging') return { table: 'packaging_items', stockColumn: 'quantity_on_hand' };
  return null;
}

function fallbackItemForMovement(itemType, itemId) {
  const source = stockColumnForItemType(itemType);
  if (!source) return null;
  return (fallbackData[source.table] || []).find((item) => String(item.id) === String(itemId)) || null;
}

async function createInventoryMovement(payload, user = null) {
  const validation = validatePayload('inventory_movements', payload);
  if (!validation.ok) return { validationError: validation };

  const movement = validation.payload;
  const target = stockColumnForItemType(movement.item_type);

  if (!target) {
    return { validationError: { status: 400, error: 'Tipo de item inválido.' } };
  }

  const quantity = Number(movement.quantity || 0);
  if (quantity <= 0) {
    return { validationError: { status: 400, error: 'A quantidade deve ser maior que zero.' } };
  }

  if (!supabase) {
    const item = fallbackItemForMovement(movement.item_type, movement.item_id);
    const before = Number(item?.[target.stockColumn] || 0);
    const direction = ['in', 'adjustment', 'release'].includes(movement.movement_type) ? 1 : -1;
    const after = movement.movement_type === 'adjustment' ? quantity : before + (direction * quantity);

    if (after < 0) {
      return { validationError: { status: 409, error: 'Movimentação geraria estoque negativo.' } };
    }

    return {
      source: 'fallback',
      data: {
        id: normalizeId(`mov-${Date.now()}`),
        ...movement,
        quantity_before: before,
        quantity_after: after,
        created_by: user?.id || null
      }
    };
  }

  const { data: item, error: itemError } = await supabase
    .from(target.table)
    .select(`id, ${target.stockColumn}`)
    .eq('id', movement.item_id)
    .maybeSingle();

  if (itemError) {
    return { data: movement, source: 'fallback', supabaseError: publicError(itemError) };
  }

  if (!item) {
    return { validationError: { status: 404, error: 'Item de estoque não encontrado.' } };
  }

  const before = Number(item[target.stockColumn] || 0);
  let after = before;

  if (movement.movement_type === 'in' || movement.movement_type === 'release') after = before + quantity;
  if (movement.movement_type === 'out' || movement.movement_type === 'reservation' || movement.movement_type === 'loss') after = before - quantity;
  if (movement.movement_type === 'adjustment' || movement.movement_type === 'inventory') after = quantity;

  if (after < 0) {
    return { validationError: { status: 409, error: 'Movimentação geraria estoque negativo.' } };
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from(target.table)
    .update({ [target.stockColumn]: after, updated_at: new Date().toISOString() })
    .eq('id', movement.item_id)
    .select('*')
    .single();

  if (updateError) {
    return { data: movement, source: 'fallback', supabaseError: publicError(updateError) };
  }

  const movementRecord = {
    id: movement.id || randomUUID(),
    ...movement,
    quantity_before: before,
    quantity_after: after,
    created_by: user?.id || null
  };

  const { data: savedMovement, error: movementError } = await supabase
    .from('inventory_movements')
    .insert(movementRecord)
    .select('*')
    .single();

  if (movementError) {
    return { data: movementRecord, source: 'fallback', supabaseError: publicError(movementError) };
  }

  await writeAuditLog({
    user,
    action: 'inventory_movement',
    table: target.table,
    recordId: movement.item_id,
    before: item,
    after: updatedItem
  });

  return { data: savedMovement, item: updatedItem, source: 'supabase' };
}

async function getFormulaItems(formulaVersionId) {
  if (!supabase) {
    return fallbackData.formula_items.filter((item) => item.formula_version_id === formulaVersionId);
  }

  const { data, error } = await supabase
    .from('formula_items')
    .select('*')
    .eq('formula_version_id', formulaVersionId)
    .order('sort_order');

  if (error) return fallbackData.formula_items.filter((item) => item.formula_version_id === formulaVersionId);
  return data || [];
}

async function completeProductionOrder(orderId, payload, user = null) {
  const approvedQuantity = Number(payload.approved_quantity || payload.produced_quantity || 0);
  if (approvedQuantity <= 0) {
    return { validationError: { status: 400, error: 'Quantidade aprovada deve ser maior que zero.' } };
  }

  if (!supabase) {
    const order = fallbackData.production_orders.find((item) => String(item.id) === String(orderId));
    if (!order) return { validationError: { status: 404, error: 'Ordem de produção não encontrada.' } };
    return {
      source: 'fallback',
      data: {
        ...order,
        status: 'finished',
        approved_quantity: approvedQuantity,
        produced_quantity: Number(payload.produced_quantity || approvedQuantity),
        completed_at: new Date().toISOString(),
        generated_lot: payload.generated_lot || `LOTE-${Date.now()}`
      }
    };
  }

  const { data: order, error: orderError } = await supabase
    .from('production_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) return { data: null, source: 'fallback', supabaseError: publicError(orderError) };
  if (!order) return { validationError: { status: 404, error: 'Ordem de produção não encontrada.' } };
  if (order.status === 'finished') return { validationError: { status: 409, error: 'Ordem de produção já finalizada.' } };

  const items = await getFormulaItems(order.formula_version_id);
  const plannedQuantity = Number(order.planned_quantity || approvedQuantity || 1);
  const factor = approvedQuantity / plannedQuantity;

  for (const item of items) {
    const requiredQuantity = Number(item.quantity || 0) * factor;
    const movement = await createInventoryMovement({
      item_type: item.item_type,
      item_id: item.item_id,
      movement_type: 'out',
      quantity: requiredQuantity,
      origin: `production:${order.order_number}`,
      unit_cost_cents: Number(item.cost_cents || 0),
      notes: `Consumo da ordem ${order.order_number}`
    }, user);

    if (movement.validationError) return movement;
  }

  const productMovement = await createInventoryMovement({
    item_type: 'product',
    item_id: order.product_id,
    movement_type: 'in',
    quantity: approvedQuantity,
    origin: `production:${order.order_number}`,
    unit_cost_cents: Number(order.estimated_cost_cents || 0),
    notes: `Entrada de produto acabado da ordem ${order.order_number}`
  }, user);

  if (productMovement.validationError) return productMovement;

  const generatedLot = payload.generated_lot || `LOTE-${order.order_number}`;
  const patch = {
    status: 'finished',
    produced_quantity: Number(payload.produced_quantity || approvedQuantity),
    approved_quantity: approvedQuantity,
    lost_quantity: Number(payload.lost_quantity || 0),
    loss_reason: payload.loss_reason || null,
    completed_at: new Date().toISOString(),
    generated_lot: generatedLot,
    expires_at: payload.expires_at || null,
    updated_at: new Date().toISOString()
  };

  const { data: updatedOrder, error: updateError } = await supabase
    .from('production_orders')
    .update(patch)
    .eq('id', order.id)
    .select('*')
    .single();

  if (updateError) return { data: patch, source: 'fallback', supabaseError: publicError(updateError) };

  await writeAuditLog({
    user,
    action: 'complete_production_order',
    table: 'production_orders',
    recordId: order.id,
    before: order,
    after: updatedOrder
  });

  const { data: existingBatch } = await supabase
    .from('product_batches')
    .select('*')
    .eq('batch_code', generatedLot)
    .maybeSingle();

  if (!existingBatch) {
    const { data: batch } = await supabase
      .from('product_batches')
      .insert({
        batch_code: generatedLot,
        production_order_id: order.id,
        product_id: order.product_id,
        formula_version_id: order.formula_version_id,
        quantity: approvedQuantity,
        manufactured_at: new Date().toISOString().slice(0, 10),
        expires_at: patch.expires_at,
        status: 'quarantine',
        notes: 'Lote gerado automaticamente ao finalizar producao.',
        created_by: user?.id || null
      })
      .select('*')
      .single();

    if (batch) {
      await supabase.from('batch_trace_events').insert({
        batch_id: batch.id,
        event_type: 'created_from_production',
        description: `Lote criado a partir da ordem ${order.order_number}.`,
        quantity: approvedQuantity,
        responsible: user?.email || order.responsible || 'Producao'
      });
    }
  }

  return { data: updatedOrder, source: 'supabase' };
}

async function createReceivableFromOrder(orderId, payload, user = null) {
  const dueDate = payload.due_date;
  if (!dueDate) {
    return { validationError: { status: 400, error: 'Informe a data de vencimento.' } };
  }

  if (!supabase) {
    const order = fallbackData.sales_orders.find((item) => String(item.id) === String(orderId));
    if (!order) return { validationError: { status: 404, error: 'Pedido não encontrado.' } };
    return {
      source: 'fallback',
      data: {
        id: normalizeId(`ar-${order.order_number}`),
        customer_id: order.customer_id,
        sales_order_id: order.id,
        description: `Pedido ${order.order_number}`,
        due_date: dueDate,
        gross_amount_cents: Number(order.total_cents || 0),
        net_amount_cents: Number(order.total_cents || 0),
        status: 'pending'
      }
    };
  }

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) return { data: null, source: 'fallback', supabaseError: publicError(orderError) };
  if (!order) return { validationError: { status: 404, error: 'Pedido não encontrado.' } };

  const { data: existing } = await supabase
    .from('accounts_receivable')
    .select('*')
    .eq('sales_order_id', order.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (existing) {
    return { validationError: { status: 409, error: 'Este pedido já possui conta a receber.' } };
  }

  const receivablePayload = {
    customer_id: order.customer_id,
    sales_order_id: order.id,
    description: payload.description || `Pedido ${order.order_number}`,
    due_date: dueDate,
    gross_amount_cents: Number(order.total_cents || 0),
    fee_cents: Number(payload.fee_cents || 0),
    net_amount_cents: Number(order.total_cents || 0) - Number(payload.fee_cents || 0),
    payment_method: payload.payment_method || null,
    status: 'pending',
    notes: payload.notes || null
  };

  const { data: receivable, error: receivableError } = await supabase
    .from('accounts_receivable')
    .insert(receivablePayload)
    .select('*')
    .single();

  if (receivableError) return { data: receivablePayload, source: 'fallback', supabaseError: publicError(receivableError) };

  await supabase.from('cash_flow_entries').insert({
    entry_date: dueDate,
    source_type: 'receivable',
    source_id: receivable.id,
    direction: 'in',
    description: receivable.description,
    amount_cents: receivable.net_amount_cents,
    status: 'planned'
  });

  await writeAuditLog({
    user,
    action: 'create_receivable_from_order',
    table: 'accounts_receivable',
    recordId: receivable.id,
    after: receivable
  });

  return { data: receivable, source: 'supabase' };
}

async function receiveAccountReceivable(receivableId, payload = {}, user = null) {
  const receivedAt = payload.received_at || new Date().toISOString().slice(0, 10);
  const paymentMethod = payload.payment_method || 'manual';

  if (!supabase) {
    const receivable = fallbackData.accounts_receivable.find((item) => String(item.id) === String(receivableId));
    if (!receivable) return { validationError: { status: 404, error: 'Conta a receber nao encontrada.' } };
    return {
      source: 'fallback',
      data: {
        receivable: { ...receivable, received_at: receivedAt, payment_method: paymentMethod, status: 'received' },
        cashFlow: { source_id: receivable.id, entry_date: receivedAt, status: 'realized' },
        order: receivable.sales_order_id ? { id: receivable.sales_order_id, payment_status: 'paid', status: 'payment_approved' } : null
      }
    };
  }

  const { data: before, error: beforeError } = await supabase
    .from('accounts_receivable')
    .select('*')
    .eq('id', receivableId)
    .maybeSingle();

  if (beforeError) return { validationError: { status: 400, error: publicError(beforeError) } };
  if (!before) return { validationError: { status: 404, error: 'Conta a receber nao encontrada.' } };
  if (before.status === 'received') {
    return { validationError: { status: 409, error: 'Esta conta ja foi recebida.' } };
  }

  const patch = {
    received_at: receivedAt,
    payment_method: paymentMethod,
    status: 'received',
    updated_at: new Date().toISOString()
  };

  const { data: receivable, error } = await supabase
    .from('accounts_receivable')
    .update(patch)
    .eq('id', receivableId)
    .select('*')
    .single();

  if (error) return { validationError: { status: 400, error: publicError(error) } };

  const { data: cashFlow } = await supabase
    .from('cash_flow_entries')
    .update({
      entry_date: receivedAt,
      amount_cents: receivable.net_amount_cents,
      status: 'realized'
    })
    .eq('source_type', 'receivable')
    .eq('source_id', receivable.id)
    .select('*')
    .maybeSingle();

  let order = null;
  if (receivable.sales_order_id) {
    const { data: updatedOrder } = await supabase
      .from('sales_orders')
      .update({
        payment_status: 'paid',
        status: 'payment_approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', receivable.sales_order_id)
      .select('*')
      .maybeSingle();
    order = updatedOrder;
  }

  await writeAuditLog({
    user,
    action: 'receive_account_receivable',
    table: 'accounts_receivable',
    recordId: receivable.id,
    before,
    after: receivable
  });

  return {
    source: 'supabase',
    data: {
      receivable,
      cashFlow,
      order
    }
  };
}

async function payAccountPayable(payableId, payload = {}, user = null) {
  const paidAt = payload.paid_at || new Date().toISOString().slice(0, 10);
  const paymentMethod = payload.payment_method || 'manual';

  if (!supabase) {
    const payable = fallbackData.accounts_payable.find((item) => String(item.id) === String(payableId));
    if (!payable) return { validationError: { status: 404, error: 'Conta a pagar nao encontrada.' } };
    return {
      source: 'fallback',
      data: {
        payable: { ...payable, paid_at: paidAt, payment_method: paymentMethod, status: 'paid' },
        cashFlow: { source_id: payable.id, entry_date: paidAt, status: 'realized' }
      }
    };
  }

  const { data: before, error: beforeError } = await supabase
    .from('accounts_payable')
    .select('*')
    .eq('id', payableId)
    .maybeSingle();

  if (beforeError) return { validationError: { status: 400, error: publicError(beforeError) } };
  if (!before) return { validationError: { status: 404, error: 'Conta a pagar nao encontrada.' } };
  if (before.status === 'paid') {
    return { validationError: { status: 409, error: 'Esta conta ja foi paga.' } };
  }

  const { data: payable, error } = await supabase
    .from('accounts_payable')
    .update({
      paid_at: paidAt,
      payment_method: paymentMethod,
      status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('id', payableId)
    .select('*')
    .single();

  if (error) return { validationError: { status: 400, error: publicError(error) } };

  const { data: cashFlow } = await supabase
    .from('cash_flow_entries')
    .update({
      entry_date: paidAt,
      amount_cents: payable.net_amount_cents || payable.amount_cents,
      status: 'realized'
    })
    .eq('source_type', 'payable')
    .eq('source_id', payable.id)
    .select('*')
    .maybeSingle();

  await writeAuditLog({
    user,
    action: 'pay_account_payable',
    table: 'accounts_payable',
    recordId: payable.id,
    before,
    after: payable
  });

  return {
    source: 'supabase',
    data: {
      payable,
      cashFlow
    }
  };
}

async function buildPurchasingData() {
  const [requests, requestItems, quotes, orders, orderItems, suppliers, rawMaterials, packagingItems] = await Promise.all([
    listTable('purchase_requests', 'created_at'),
    listTable('purchase_request_items', 'created_at'),
    listTable('purchase_quotes', 'created_at'),
    listTable('purchase_orders', 'created_at'),
    listTable('purchase_order_items', 'created_at'),
    listTable('suppliers', 'created_at'),
    listTable('raw_materials', 'created_at'),
    listTable('packaging_items', 'created_at')
  ]);

  const openRequests = requests.data.filter((item) => !['received', 'cancelled'].includes(item.status));
  const openOrders = orders.data.filter((item) => !['received', 'cancelled'].includes(item.status));
  const totalOpenCents = openOrders.reduce((sum, item) => sum + Number(item.total_cents || 0), 0);
  const lowStock = [
    ...rawMaterials.data.filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0)).map((item) => ({ ...item, item_type: 'raw_material' })),
    ...packagingItems.data.filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0)).map((item) => ({ ...item, item_type: 'packaging' }))
  ];

  return {
    source: orders.source,
    metrics: {
      requests: requests.data.length,
      openRequests: openRequests.length,
      quotes: quotes.data.length,
      openOrders: openOrders.length,
      totalOpenCents,
      lowStock: lowStock.length
    },
    requests,
    requestItems,
    quotes,
    orders,
    orderItems,
    suppliers,
    rawMaterials,
    packagingItems,
    lowStock: { data: lowStock, source: rawMaterials.source === 'supabase' || packagingItems.source === 'supabase' ? 'supabase' : 'fallback' }
  };
}

async function buildMarketingData() {
  const [campaigns, contentItems, calendarEvents, leads, results, customers, opportunities] = await Promise.all([
    listTable('marketing_campaigns', 'created_at'),
    listTable('marketing_content_items', 'publish_at'),
    listTable('marketing_calendar_events', 'event_date'),
    listTable('marketing_leads', 'created_at'),
    listTable('marketing_results', 'result_date'),
    listTable('customers', 'created_at'),
    listTable('sales_opportunities', 'created_at')
  ]);

  const resultRows = results.data || [];
  const totalSpend = resultRows.reduce((sum, item) => sum + Number(item.spend_cents || 0), 0);
  const totalRevenue = resultRows.reduce((sum, item) => sum + Number(item.revenue_cents || 0), 0);
  const totalLeads = resultRows.reduce((sum, item) => sum + Number(item.leads || 0), 0) || leads.data.length;
  const conversions = resultRows.reduce((sum, item) => sum + Number(item.conversions || 0), 0);
  const roiPercent = totalSpend > 0 ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : 0;

  return {
    source: campaigns.source,
    metrics: {
      campaigns: campaigns.data.length,
      activeCampaigns: campaigns.data.filter((item) => item.status === 'active').length,
      scheduledContent: contentItems.data.filter((item) => item.status === 'scheduled').length,
      calendarEvents: calendarEvents.data.length,
      leads: totalLeads,
      conversions,
      totalSpend,
      totalRevenue,
      roiPercent,
      consentCustomers: customers.data.filter((item) => item.marketing_consent).length,
      marketingOpportunities: opportunities.data.filter((item) => ['Instagram', 'WhatsApp', 'Site', 'Evento'].includes(item.source)).length
    },
    campaigns,
    contentItems,
    calendarEvents,
    leads,
    results,
    customers,
    opportunities
  };
}

async function buildLogisticsData() {
  const [carriers, shipments, shipmentEvents, followups, feedback, orders, customers] = await Promise.all([
    listTable('carriers', 'created_at'),
    listTable('shipments', 'created_at'),
    listTable('shipment_events', 'event_date'),
    listTable('after_sales_followups', 'followup_date'),
    listTable('customer_feedback', 'feedback_date'),
    listTable('sales_orders', 'created_at'),
    listTable('customers', 'created_at')
  ]);

  const shipmentRows = shipments.data || [];
  const openShipments = shipmentRows.filter((item) => !['delivered', 'returned', 'cancelled'].includes(item.status));
  const delayedShipments = shipmentRows.filter((item) => {
    const days = daysFromToday(item.expected_delivery);
    return days !== null && days < 0 && !['delivered', 'returned', 'cancelled'].includes(item.status);
  });
  const plannedFollowups = followups.data.filter((item) => item.status === 'planned');
  const avgRating = feedback.data.length
    ? Math.round((feedback.data.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.data.length) * 10) / 10
    : 0;
  const avgNps = feedback.data.length
    ? Math.round(feedback.data.reduce((sum, item) => sum + Number(item.nps || 0), 0) / feedback.data.length)
    : 0;

  return {
    source: shipments.source,
    metrics: {
      carriers: carriers.data.length,
      shipments: shipmentRows.length,
      openShipments: openShipments.length,
      delayedShipments: delayedShipments.length,
      delivered: shipmentRows.filter((item) => item.status === 'delivered').length,
      followups: plannedFollowups.length,
      feedback: feedback.data.length,
      avgRating,
      avgNps
    },
    carriers,
    shipments,
    shipmentEvents,
    followups,
    feedback,
    orders,
    customers
  };
}

async function buildOfferData() {
  const [kits, kitItems, plans, subscriptions, cycles, products, customers] = await Promise.all([
    listTable('product_kits', 'created_at'),
    listTable('product_kit_items', 'created_at'),
    listTable('subscription_plans', 'created_at'),
    listTable('customer_subscriptions', 'created_at'),
    listTable('subscription_cycles', 'billing_date'),
    listTable('products', 'created_at'),
    listTable('customers', 'created_at')
  ]);

  const activeSubscriptions = subscriptions.data.filter((item) => item.status === 'active');
  const plannedCycles = cycles.data.filter((item) => item.status === 'planned');
  const recurringRevenue = activeSubscriptions.reduce((sum, subscription) => {
    const plan = plans.data.find((item) => String(item.id) === String(subscription.plan_id));
    return sum + Number(plan?.price_cents || 0);
  }, 0);

  return {
    source: kits.source,
    metrics: {
      kits: kits.data.length,
      activeKits: kits.data.filter((item) => item.active).length,
      kitItems: kitItems.data.length,
      plans: plans.data.length,
      activePlans: plans.data.filter((item) => item.active).length,
      subscriptions: subscriptions.data.length,
      activeSubscriptions: activeSubscriptions.length,
      plannedCycles: plannedCycles.length,
      recurringRevenue
    },
    kits,
    kitItems,
    plans,
    subscriptions,
    cycles,
    products,
    customers
  };
}

function addDays(dateText, days) {
  const date = dateText ? new Date(dateText) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function generateSubscriptionCycle(subscriptionId, payload = {}, user = null) {
  const subscriptions = await listTable('customer_subscriptions', 'created_at');
  const subscription = subscriptions.data.find((item) => String(item.id) === String(subscriptionId));
  if (!subscription) return { validationError: { status: 404, error: 'Assinatura nao encontrada.' } };

  const [plans, cycles] = await Promise.all([
    listTable('subscription_plans', 'created_at'),
    listTable('subscription_cycles', 'billing_date')
  ]);
  const plan = plans.data.find((item) => String(item.id) === String(subscription.plan_id));
  const subscriptionCycles = cycles.data.filter((item) => String(item.subscription_id) === String(subscriptionId));
  const cycleNumber = Math.max(0, ...subscriptionCycles.map((item) => Number(item.cycle_number || 0))) + 1;
  const billingDate = payload.billing_date || subscription.next_billing_date || new Date().toISOString().slice(0, 10);
  const shippingDate = payload.shipping_date || subscription.next_shipping_date || addDays(billingDate, 2);
  const record = {
    subscription_id: subscriptionId,
    cycle_number: cycleNumber,
    billing_date: billingDate,
    shipping_date: shippingDate,
    amount_cents: Number(payload.amount_cents || plan?.price_cents || 0),
    status: 'planned',
    notes: payload.notes || `Ciclo ${cycleNumber} gerado pelo painel.`
  };

  if (!supabase) {
    return { source: 'fallback', data: { id: `sub-cycle-${cycleNumber}`, ...record } };
  }

  const { data, error } = await supabase.from('subscription_cycles').insert(record).select('*').single();
  if (error) return { validationError: { status: 400, error: publicError(error) } };

  await supabase
    .from('customer_subscriptions')
    .update({
      next_billing_date: addDays(billingDate, 30),
      next_shipping_date: addDays(shippingDate, 30),
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  await writeAuditLog({
    user,
    action: 'generate_cycle',
    table: 'subscription_cycles',
    recordId: data.id,
    after: data
  });

  return { data, source: 'supabase' };
}

async function billSubscriptionCycle(cycleId, payload = {}, user = null) {
  const cycles = await listTable('subscription_cycles', 'billing_date');
  const cycle = cycles.data.find((item) => String(item.id) === String(cycleId));
  if (!cycle) return { validationError: { status: 404, error: 'Ciclo de assinatura nao encontrado.' } };
  if (cycle.sales_order_id || cycle.status === 'billed') {
    return { validationError: { status: 409, error: 'Este ciclo ja foi faturado.' } };
  }

  const [subscriptions, plans, kits, kitItems] = await Promise.all([
    listTable('customer_subscriptions', 'created_at'),
    listTable('subscription_plans', 'created_at'),
    listTable('product_kits', 'created_at'),
    listTable('product_kit_items', 'created_at')
  ]);
  const subscription = subscriptions.data.find((item) => String(item.id) === String(cycle.subscription_id));
  if (!subscription) return { validationError: { status: 404, error: 'Assinatura do ciclo nao encontrada.' } };

  const plan = plans.data.find((item) => String(item.id) === String(subscription.plan_id));
  const kit = kits.data.find((item) => String(item.id) === String(plan?.kit_id));
  const items = kitItems.data.filter((item) => String(item.kit_id) === String(kit?.id));
  const total = Number(cycle.amount_cents || plan?.price_cents || kit?.sale_price_cents || 0);
  const orderNumber = payload.order_number || `ASS-${subscription.subscription_number || 'SUB'}-${String(cycle.cycle_number || 1).padStart(3, '0')}`;
  const orderPayload = {
    id: randomUUID(),
    order_number: orderNumber,
    customer_id: subscription.customer_id || null,
    channel: 'Assinatura',
    seller: 'Sistema',
    subtotal_cents: total,
    discount_cents: 0,
    freight_cents: 0,
    total_cents: total,
    payment_status: 'pending',
    expected_date: cycle.shipping_date || null,
    notes: `Faturado a partir da assinatura ${subscription.subscription_number || subscription.id}, ciclo ${cycle.cycle_number}.`,
    status: 'awaiting_payment'
  };

  if (!supabase) {
    return {
      source: 'fallback',
      data: {
        order: orderPayload,
        receivable: {
          id: normalizeId(`ar-${orderNumber}`),
          customer_id: orderPayload.customer_id,
          sales_order_id: orderPayload.id,
          description: `Assinatura ${subscription.subscription_number || ''} - ciclo ${cycle.cycle_number}`,
          due_date: cycle.billing_date,
          gross_amount_cents: total,
          net_amount_cents: total,
          status: 'pending'
        },
        cycle: { ...cycle, status: 'billed', sales_order_id: orderPayload.id }
      }
    };
  }

  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .insert(orderPayload)
    .select('*')
    .single();

  if (orderError) return { validationError: { status: 400, error: publicError(orderError) } };

  const orderItems = items.length
    ? items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id || null,
        description: item.description,
        quantity: Number(item.quantity || 1),
        unit_price_cents: Number(item.unit_price_cents || 0),
        total_cents: Number(item.unit_price_cents || 0) * Number(item.quantity || 1),
        unit_cost_cents: Number(item.unit_cost_cents || 0),
        margin_cents: (Number(item.unit_price_cents || 0) - Number(item.unit_cost_cents || 0)) * Number(item.quantity || 1)
      }))
    : [{
        order_id: order.id,
        product_id: null,
        description: plan?.name || kit?.name || 'Assinatura Aromas da Biblia',
        quantity: 1,
        unit_price_cents: total,
        total_cents: total,
        unit_cost_cents: 0,
        margin_cents: total
      }];

  await supabase.from('sales_order_items').insert(orderItems);

  const receivableResult = await createReceivableFromOrder(order.id, {
    due_date: cycle.billing_date,
    description: `Assinatura ${subscription.subscription_number || ''} - ciclo ${cycle.cycle_number}`,
    payment_method: payload.payment_method || null,
    notes: payload.notes || 'Recebivel gerado a partir de ciclo de assinatura.'
  }, user);

  if (receivableResult.validationError) return receivableResult;

  const { data: updatedCycle, error: cycleError } = await supabase
    .from('subscription_cycles')
    .update({
      status: 'billed',
      sales_order_id: order.id,
      notes: payload.notes || cycle.notes
    })
    .eq('id', cycle.id)
    .select('*')
    .single();

  if (cycleError) return { validationError: { status: 400, error: publicError(cycleError) } };

  await supabase
    .from('customer_subscriptions')
    .update({
      cycles_completed: Number(subscription.cycles_completed || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);

  await writeAuditLog({
    user,
    action: 'bill_subscription_cycle',
    table: 'subscription_cycles',
    recordId: cycle.id,
    before: cycle,
    after: updatedCycle
  });

  return {
    source: 'supabase',
    data: {
      order,
      receivable: receivableResult.data,
      cycle: updatedCycle
    }
  };
}

async function updateShipmentStatus(shipmentId, payload, user = null) {
  const status = String(payload.status || '');
  if (!['pending', 'label_ready', 'shipped', 'in_transit', 'delivered', 'delayed', 'returned', 'cancelled'].includes(status)) {
    return { validationError: { status: 400, error: 'Status de envio invalido.' } };
  }

  if (!supabase) {
    return { source: 'fallback', data: { id: shipmentId, status, delivered_at: status === 'delivered' ? new Date().toISOString().slice(0, 10) : null } };
  }

  const { data: before } = await supabase.from('shipments').select('*').eq('id', shipmentId).maybeSingle();
  if (!before) return { validationError: { status: 404, error: 'Envio nao encontrado.' } };

  const patch = {
    status,
    updated_at: new Date().toISOString()
  };
  if (status === 'delivered') patch.delivered_at = payload.delivered_at || new Date().toISOString().slice(0, 10);
  if (status === 'shipped' && !before.shipped_at) patch.shipped_at = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('shipments')
    .update(patch)
    .eq('id', shipmentId)
    .select('*')
    .single();

  if (error) return { validationError: { status: 404, error: publicError(error) } };

  await supabase.from('shipment_events').insert({
    shipment_id: shipmentId,
    status,
    description: payload.description || `Status alterado para ${status}.`,
    location: payload.location || null
  });

  if (data.sales_order_id) {
    const orderStatus = status === 'delivered'
      ? 'delivered'
      : status === 'shipped' || status === 'in_transit'
        ? 'shipped'
        : null;
    if (orderStatus) {
      await supabase
        .from('sales_orders')
        .update({ status: orderStatus, tracking_code: data.tracking_code, updated_at: new Date().toISOString() })
        .eq('id', data.sales_order_id);
    }
  }

  await writeAuditLog({
    user,
    action: `shipment_${status}`,
    table: 'shipments',
    recordId: shipmentId,
    before,
    after: data
  });

  return { data, source: 'supabase' };
}

async function receivePurchaseOrder(orderId, payload, user = null) {
  const dueDate = payload.due_date || new Date().toISOString().slice(0, 10);

  if (!supabase) {
    const order = fallbackData.purchase_orders.find((item) => String(item.id) === String(orderId));
    if (!order) return { validationError: { status: 404, error: 'Pedido de compra nao encontrado.' } };
    return { source: 'fallback', data: { ...order, status: 'received', received_at: new Date().toISOString().slice(0, 10), due_date: dueDate } };
  }

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) return { data: null, source: 'fallback', supabaseError: publicError(orderError) };
  if (!order) return { validationError: { status: 404, error: 'Pedido de compra nao encontrado.' } };
  if (order.status === 'received') return { validationError: { status: 409, error: 'Pedido de compra ja recebido.' } };

  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_order_id', order.id);

  if (itemsError) return { data: null, source: 'fallback', supabaseError: publicError(itemsError) };

  for (const item of items || []) {
    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) continue;

    const movement = await createInventoryMovement({
      item_type: item.item_type,
      item_id: item.item_id,
      movement_type: 'in',
      quantity,
      origin: `purchase:${order.order_number}`,
      unit_cost_cents: Number(item.unit_cost_cents || 0),
      notes: `Entrada da compra ${order.order_number}`
    }, user);

    if (movement.validationError) return movement;

    await supabase
      .from('purchase_order_items')
      .update({ received_quantity: quantity })
      .eq('id', item.id);
  }

  const patch = {
    status: 'received',
    received_at: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString()
  };

  const { data: updatedOrder, error: updateError } = await supabase
    .from('purchase_orders')
    .update(patch)
    .eq('id', order.id)
    .select('*')
    .single();

  if (updateError) return { data: patch, source: 'fallback', supabaseError: publicError(updateError) };

  const { data: payable } = await supabase
    .from('accounts_payable')
    .insert({
      supplier_id: order.supplier_id,
      description: `Compra ${order.order_number}`,
      competence_date: order.order_date,
      due_date: dueDate,
      amount_cents: Number(order.total_cents || 0),
      net_amount_cents: Number(order.total_cents || 0),
      status: 'pending',
      notes: payload.notes || null
    })
    .select('*')
    .single();

  if (payable) {
    await supabase.from('cash_flow_entries').insert({
      entry_date: dueDate,
      source_type: 'payable',
      source_id: payable.id,
      direction: 'out',
      description: payable.description,
      amount_cents: payable.net_amount_cents,
      status: 'planned'
    });
  }

  await writeAuditLog({
    user,
    action: 'receive_purchase_order',
    table: 'purchase_orders',
    recordId: order.id,
    before: order,
    after: updatedOrder
  });

  return { data: updatedOrder, payable, source: 'supabase' };
}

async function buildDreReport() {
  const [orders, orderItems, payable, receivable] = await Promise.all([
    listTable('sales_orders', 'created_at'),
    listTable('sales_order_items', 'created_at'),
    listTable('accounts_payable', 'due_date'),
    listTable('accounts_receivable', 'due_date')
  ]);

  const grossRevenue = orders.data
    .filter((item) => !['cancelled', 'returned'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.total_cents || 0), 0);
  const discounts = orders.data.reduce((sum, item) => sum + Number(item.discount_cents || 0), 0);
  const netRevenue = grossRevenue - discounts;
  const cogs = orderItems.data.reduce((sum, item) => sum + (Number(item.unit_cost_cents || 0) * Number(item.quantity || 0)), 0);
  const grossProfit = netRevenue - cogs;
  const variableExpenses = payable.data
    .filter((item) => item.status !== 'cancelled')
    .reduce((sum, item) => sum + Number(item.net_amount_cents || item.amount_cents || 0), 0);
  const contributionMargin = grossProfit - variableExpenses;
  const operatingResult = contributionMargin;
  const receivableOpen = receivable.data
    .filter((item) => ['pending', 'partial'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.net_amount_cents || 0), 0);

  return {
    source: orders.source,
    rows: [
      { label: 'Receita bruta', amount_cents: grossRevenue },
      { label: 'Descontos', amount_cents: -discounts },
      { label: 'Receita líquida', amount_cents: netRevenue },
      { label: 'CPV - custo dos produtos vendidos', amount_cents: -cogs },
      { label: 'Lucro bruto', amount_cents: grossProfit },
      { label: 'Despesas variáveis e operacionais', amount_cents: -variableExpenses },
      { label: 'Margem de contribuição', amount_cents: contributionMargin },
      { label: 'Resultado operacional', amount_cents: operatingResult }
    ],
    metrics: {
      grossRevenue,
      netRevenue,
      cogs,
      grossProfit,
      variableExpenses,
      contributionMargin,
      operatingResult,
      receivableOpen,
      grossMarginPercent: netRevenue > 0 ? Math.round((grossProfit / netRevenue) * 100) : 0
    }
  };
}

function simulatePricing(input) {
  const cost = Number(input.cost_cents || 0);
  const packaging = Number(input.packaging_cents || 0);
  const taxPercent = Number(input.tax_percent || 0);
  const paymentFeePercent = Number(input.payment_fee_percent || 0);
  const commissionPercent = Number(input.commission_percent || 0);
  const marketplacePercent = Number(input.marketplace_percent || 0);
  const marketing = Number(input.marketing_cents || 0);
  const freight = Number(input.freight_cents || 0);
  const desiredMarginPercent = Number(input.desired_margin_percent || 55);

  const baseCost = cost + packaging + marketing + freight;
  const variableRate = (taxPercent + paymentFeePercent + commissionPercent + marketplacePercent) / 100;
  const desiredMarginRate = desiredMarginPercent / 100;
  const denominator = Math.max(1 - variableRate - desiredMarginRate, 0.01);
  const suggestedPrice = Math.ceil(baseCost / denominator);
  const variableFees = Math.round(suggestedPrice * variableRate);
  const totalCost = baseCost + variableFees;
  const unitProfit = suggestedPrice - totalCost;
  const grossMarginPercent = suggestedPrice > 0 ? Math.round((unitProfit / suggestedPrice) * 100) : 0;
  const minimumPrice = Math.ceil(baseCost / Math.max(1 - variableRate, 0.01));
  const resellerPrice = Math.ceil(suggestedPrice * 0.7);
  const promotionalPrice = Math.ceil(suggestedPrice * 0.9);

  return {
    inputs: input,
    baseCost,
    variableRatePercent: Math.round(variableRate * 10000) / 100,
    suggestedPrice,
    minimumPrice,
    resellerPrice,
    promotionalPrice,
    variableFees,
    totalCost,
    unitProfit,
    grossMarginPercent,
    alerts: [
      ...(suggestedPrice <= baseCost ? ['Preço sugerido abaixo do custo base.'] : []),
      ...(grossMarginPercent < desiredMarginPercent ? ['Margem abaixo da desejada.'] : []),
      ...(minimumPrice <= 0 ? ['Preço mínimo inválido.'] : [])
    ]
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, columns) {
  const header = columns.map((column) => csvEscape(column.label)).join(';');
  const body = rows.map((row) =>
    columns.map((column) => csvEscape(row[column.key])).join(';')
  );
  return [header, ...body].join('\n');
}

async function buildReports() {
  const [commercial, finance, catalog, production] = await Promise.all([
    Promise.all([
      listTable('sales_orders', 'created_at'),
      listTable('sales_order_items', 'created_at'),
      listTable('customers', 'created_at'),
      listTable('sales_opportunities', 'created_at')
    ]),
    Promise.all([
      listTable('accounts_receivable', 'due_date'),
      listTable('accounts_payable', 'due_date'),
      listTable('cash_flow_entries', 'entry_date')
    ]),
    Promise.all([
      listTable('products', 'created_at'),
      listTable('raw_materials', 'created_at'),
      listTable('packaging_items', 'created_at'),
      listTable('fragrances', 'created_at')
    ]),
    Promise.all([
      listTable('production_orders', 'created_at'),
      listTable('inventory_movements', 'created_at')
    ])
  ]);

  const [orders, orderItems, customers, opportunities] = commercial;
  const [receivable, payable, cashFlow] = finance;
  const [products, rawMaterials, packagingItems, fragrances] = catalog;
  const [productionOrders, inventoryMovements] = production;

  const salesByStatus = Object.entries(orders.data.reduce((acc, order) => {
    acc[order.status || 'sem_status'] = (acc[order.status || 'sem_status'] || 0) + Number(order.total_cents || 0);
    return acc;
  }, {})).map(([status, total_cents]) => ({ status, total_cents }));

  const stockAlerts = [
    ...products.data
      .filter((item) => Number(item.current_stock || 0) <= Number(item.minimum_stock || 0))
      .map((item) => ({ type: 'product', name: item.name, stock: item.current_stock, minimum: item.minimum_stock })),
    ...rawMaterials.data
      .filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0))
      .map((item) => ({ type: 'raw_material', name: item.name, stock: item.quantity_on_hand, minimum: item.minimum_stock })),
    ...packagingItems.data
      .filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0))
      .map((item) => ({ type: 'packaging', name: item.name, stock: item.quantity_on_hand, minimum: item.minimum_stock }))
  ];

  const customerSummary = customers.data.map((customer) => ({
    name: customer.name,
    type: customer.type,
    channel: customer.acquisition_channel,
    status: customer.status
  }));

  return {
    generatedAt: new Date().toISOString(),
    source: orders.source,
    reports: {
      salesByStatus,
      salesItems: orderItems.data,
      stockAlerts,
      customers: customerSummary,
      opportunities: opportunities.data,
      receivable: receivable.data,
      payable: payable.data,
      cashFlow: cashFlow.data,
      productionOrders: productionOrders.data,
      inventoryMovements: inventoryMovements.data,
      products: products.data,
      rawMaterials: rawMaterials.data,
      packagingItems: packagingItems.data,
      fragrances: fragrances.data
    },
    metrics: {
      totalOrders: orders.data.length,
      totalRevenue: orders.data.reduce((sum, item) => sum + Number(item.total_cents || 0), 0),
      totalCustomers: customers.data.length,
      totalOpportunities: opportunities.data.length,
      stockAlerts: stockAlerts.length,
      receivableOpen: receivable.data.filter((item) => ['pending', 'partial'].includes(item.status)).length,
      payableOpen: payable.data.filter((item) => ['pending', 'partial'].includes(item.status)).length,
      productionOpen: productionOrders.data.filter((item) => !['finished', 'cancelled'].includes(item.status)).length
    }
  };
}

const reportExports = {
  sales: {
    getRows: (reports) => reports.reports.salesByStatus,
    columns: [
      { key: 'status', label: 'Status' },
      { key: 'total_cents', label: 'Total em centavos' }
    ]
  },
  stock: {
    getRows: (reports) => reports.reports.stockAlerts,
    columns: [
      { key: 'type', label: 'Tipo' },
      { key: 'name', label: 'Item' },
      { key: 'stock', label: 'Estoque' },
      { key: 'minimum', label: 'Mínimo' }
    ]
  },
  customers: {
    getRows: (reports) => reports.reports.customers,
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'type', label: 'Tipo' },
      { key: 'channel', label: 'Canal' },
      { key: 'status', label: 'Status' }
    ]
  },
  receivable: {
    getRows: (reports) => reports.reports.receivable,
    columns: [
      { key: 'description', label: 'Descrição' },
      { key: 'due_date', label: 'Vencimento' },
      { key: 'net_amount_cents', label: 'Valor líquido em centavos' },
      { key: 'status', label: 'Status' }
    ]
  },
  payable: {
    getRows: (reports) => reports.reports.payable,
    columns: [
      { key: 'description', label: 'Descrição' },
      { key: 'due_date', label: 'Vencimento' },
      { key: 'net_amount_cents', label: 'Valor líquido em centavos' },
      { key: 'status', label: 'Status' }
    ]
  },
  production: {
    getRows: (reports) => reports.reports.productionOrders,
    columns: [
      { key: 'order_number', label: 'Ordem' },
      { key: 'planned_quantity', label: 'Planejado' },
      { key: 'approved_quantity', label: 'Aprovado' },
      { key: 'status', label: 'Status' }
    ]
  }
};

function daysFromToday(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

async function buildNotifications() {
  const [persisted, products, rawMaterials, packagingItems, receivable, payable, productionOrders, opportunities] = await Promise.all([
    listTable('notifications', 'created_at'),
    listTable('products', 'created_at'),
    listTable('raw_materials', 'created_at'),
    listTable('packaging_items', 'created_at'),
    listTable('accounts_receivable', 'due_date'),
    listTable('accounts_payable', 'due_date'),
    listTable('production_orders', 'created_at'),
    listTable('sales_opportunities', 'return_date')
  ]);

  const dynamic = [];

  for (const item of products.data) {
    if (Number(item.current_stock || 0) <= Number(item.minimum_stock || 0)) {
      dynamic.push({
        id: `dyn-product-stock-${item.id}`,
        type: 'stock_low',
        severity: 'warning',
        title: `Produto abaixo do mínimo: ${item.name}`,
        message: `Saldo ${item.current_stock || 0}; mínimo ${item.minimum_stock || 0}.`,
        entity_table: 'products',
        entity_id: item.id,
        status: 'unread',
        dynamic: true
      });
    }
  }

  for (const item of rawMaterials.data) {
    if (Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0)) {
      dynamic.push({
        id: `dyn-raw-stock-${item.id}`,
        type: 'stock_low',
        severity: 'warning',
        title: `Insumo abaixo do mínimo: ${item.name}`,
        message: `Saldo ${item.quantity_on_hand || 0}; mínimo ${item.minimum_stock || 0}.`,
        entity_table: 'raw_materials',
        entity_id: item.id,
        status: 'unread',
        dynamic: true
      });
    }
  }

  for (const item of packagingItems.data) {
    if (Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0)) {
      dynamic.push({
        id: `dyn-pack-stock-${item.id}`,
        type: 'stock_low',
        severity: 'warning',
        title: `Embalagem abaixo do mínimo: ${item.name}`,
        message: `Saldo ${item.quantity_on_hand || 0}; mínimo ${item.minimum_stock || 0}.`,
        entity_table: 'packaging_items',
        entity_id: item.id,
        status: 'unread',
        dynamic: true
      });
    }
  }

  for (const item of receivable.data.filter((row) => ['pending', 'partial'].includes(row.status))) {
    const days = daysFromToday(item.due_date);
    if (days !== null && days <= 3) {
      dynamic.push({
        id: `dyn-receivable-${item.id}`,
        type: days < 0 ? 'accounts_receivable_overdue' : 'accounts_receivable_due',
        severity: days < 0 ? 'critical' : 'info',
        title: days < 0 ? `Recebível vencido: ${item.description}` : `Recebível vence em ${days} dia(s)`,
        message: item.description,
        entity_table: 'accounts_receivable',
        entity_id: item.id,
        due_date: item.due_date,
        status: 'unread',
        dynamic: true
      });
    }
  }

  for (const item of payable.data.filter((row) => ['pending', 'partial'].includes(row.status))) {
    const days = daysFromToday(item.due_date);
    if (days !== null && days <= 3) {
      dynamic.push({
        id: `dyn-payable-${item.id}`,
        type: days < 0 ? 'accounts_payable_overdue' : 'accounts_payable_due',
        severity: days < 0 ? 'critical' : 'warning',
        title: days < 0 ? `Conta vencida: ${item.description}` : `Conta vence em ${days} dia(s)`,
        message: item.description,
        entity_table: 'accounts_payable',
        entity_id: item.id,
        due_date: item.due_date,
        status: 'unread',
        dynamic: true
      });
    }
  }

  for (const item of productionOrders.data.filter((row) => !['finished', 'cancelled'].includes(row.status))) {
    dynamic.push({
      id: `dyn-production-${item.id}`,
      type: 'production_open',
      severity: 'info',
      title: `Produção em aberto: ${item.order_number}`,
      message: `Status atual: ${item.status}.`,
      entity_table: 'production_orders',
      entity_id: item.id,
      status: 'unread',
      dynamic: true
    });
  }

  for (const item of opportunities.data.filter((row) => !['approved', 'lost', 'after_sales'].includes(row.stage))) {
    const days = daysFromToday(item.return_date);
    if (days !== null && days < 0) {
      dynamic.push({
        id: `dyn-opportunity-${item.id}`,
        type: 'follow_up_overdue',
        severity: 'warning',
        title: `Follow-up atrasado: ${item.title}`,
        message: item.next_action || 'Retomar contato comercial.',
        entity_table: 'sales_opportunities',
        entity_id: item.id,
        due_date: item.return_date,
        status: 'unread',
        dynamic: true
      });
    }
  }

  const all = [...dynamic, ...(persisted.data || [])].filter((item) => item.status !== 'resolved' && item.status !== 'ignored');

  return {
    source: persisted.source,
    metrics: {
      total: all.length,
      unread: all.filter((item) => item.status === 'unread').length,
      critical: all.filter((item) => item.severity === 'critical').length,
      warning: all.filter((item) => item.severity === 'warning').length,
      dynamic: dynamic.length
    },
    notifications: all
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Aromas da Biblia',
    service: 'web-service',
    supabase: Boolean(supabase)
  });
});

app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl: supabaseUrl || null,
    supabaseAnonKey: supabaseAnonKey || null,
    supabasePublishableKey: supabaseAnonKey || null
  });
});

app.get('/api/dashboard', requireAdminAuth, async (_req, res) => {
  const [produtos, pedidos, estoque, financeiro, custos, campanhas] = await Promise.all([
    listTable('produtos', 'nome'),
    listTable('pedidos', 'created_at'),
    listTable('estoque', 'item'),
    listTable('financeiro', 'created_at'),
    listTable('custos', 'created_at'),
    listTable('campanhas', 'created_at')
  ]);

  const receitaProjetada = financeiro.data.reduce((sum, item) => sum + Number(item.receita || 0), 0);
  const custosProjetados = financeiro.data.reduce((sum, item) => sum + Number(item.custos || 0), 0);
  const custoUnitario = custos.data.reduce((sum, item) => sum + Number(item.valor_unitario || 0), 0);
  const pedidosMes = pedidos.data.reduce((sum, item) => sum + Number(item.quantidade || 1), 0);
  const estoqueCritico = estoque.data.filter((item) => Number(item.quantidade) <= Number(item.minimo)).length;
  const margemBruta = receitaProjetada > 0 ? Math.round(((receitaProjetada - custosProjetados) / receitaProjetada) * 100) : 0;

  res.json({
    negocio: 'Aromas da Biblia',
    fase: 'Plano de negócios evoluindo para sistema',
    source: produtos.source,
    indicadores: {
      receitaProjetada,
      margemBruta,
      produtosAtivos: produtos.data.length,
      pedidosMes,
      campanhasAtivas: campanhas.data.length,
      estoqueCritico,
      custoUnitario
    },
    proximosModulos: ['Produtos', 'Pedidos', 'Clientes', 'Financeiro', 'Estoque', 'Campanhas']
  });
});

app.get('/api/admin/health', requireAdminAuth, (req, res) => {
  res.json({
    ok: true,
    app: 'Aromas da Biblia',
    service: 'admin',
    supabase: Boolean(supabase),
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

app.get('/api/admin/dashboard', requireAdminAuth, async (_req, res) => {
  const [produtos, pedidos, estoque, financeiro, custos, campanhas] = await Promise.all([
    listTable('produtos', 'nome'),
    listTable('pedidos', 'created_at'),
    listTable('estoque', 'item'),
    listTable('financeiro', 'created_at'),
    listTable('custos', 'created_at'),
    listTable('campanhas', 'created_at')
  ]);

  const receitaProjetada = financeiro.data.reduce((sum, item) => sum + Number(item.receita || 0), 0);
  const custosProjetados = financeiro.data.reduce((sum, item) => sum + Number(item.custos || 0), 0);
  const custoUnitario = custos.data.reduce((sum, item) => sum + Number(item.valor_unitario || 0), 0);
  const pedidosMes = pedidos.data.reduce((sum, item) => sum + Number(item.quantidade || 1), 0);
  const estoqueCritico = estoque.data.filter((item) => Number(item.quantidade) <= Number(item.minimo)).length;
  const margemBruta = receitaProjetada > 0 ? Math.round(((receitaProjetada - custosProjetados) / receitaProjetada) * 100) : 0;

  res.json({
    negocio: 'Aromas da Biblia',
    fase: 'Fundação administrativa',
    source: produtos.source,
    indicadores: {
      receitaProjetada,
      margemBruta,
      produtosAtivos: produtos.data.length,
      pedidosMes,
      campanhasAtivas: campanhas.data.length,
      estoqueCritico,
      custoUnitario
    }
  });
});

app.get('/api/admin/system', requireAdminAuth, async (_req, res) => {
  const entries = await Promise.all(
    Object.keys(fallbackData).map(async (table) => [table, await listTable(table)])
  );

  res.json(Object.fromEntries(entries));
});

app.get('/api/admin/catalog', requireAdminAuth, async (_req, res) => {
  const [fragrances, products, rawMaterials, packagingItems, suppliers, movements] = await Promise.all([
    listTable('fragrances', 'created_at'),
    listTable('products', 'created_at'),
    listTable('raw_materials', 'created_at'),
    listTable('packaging_items', 'created_at'),
    listTable('suppliers', 'created_at'),
    listTable('inventory_movements', 'created_at')
  ]);

  const lowRawMaterials = rawMaterials.data.filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0));
  const lowPackaging = packagingItems.data.filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0));
  const activeProducts = products.data.filter((item) => item.status === 'active');

  res.json({
    source: products.source,
    metrics: {
      fragrances: fragrances.data.length,
      products: products.data.length,
      activeProducts: activeProducts.length,
      rawMaterials: rawMaterials.data.length,
      packagingItems: packagingItems.data.length,
      suppliers: suppliers.data.length,
      lowStockAlerts: lowRawMaterials.length + lowPackaging.length,
      movements: movements.data.length
    },
    fragrances,
    products,
    rawMaterials,
    packagingItems,
    suppliers,
    movements
  });
});

app.get('/api/admin/production', requireAdminAuth, async (_req, res) => {
  const [formulas, formulaVersions, formulaItems, productionOrders] = await Promise.all([
    listTable('formulas', 'created_at'),
    listTable('formula_versions', 'created_at'),
    listTable('formula_items', 'created_at'),
    listTable('production_orders', 'created_at')
  ]);

  res.json({
    source: productionOrders.source,
    metrics: {
      formulas: formulas.data.length,
      versions: formulaVersions.data.length,
      openOrders: productionOrders.data.filter((item) => item.status !== 'finished' && item.status !== 'cancelled').length,
      finishedOrders: productionOrders.data.filter((item) => item.status === 'finished').length
    },
    formulas,
    formulaVersions,
    formulaItems,
    productionOrders
  });
});

app.get('/api/admin/commercial', requireAdminAuth, async (_req, res) => {
  const [customers, opportunities, quotes, quoteItems, orders, orderItems] = await Promise.all([
    listTable('customers', 'created_at'),
    listTable('sales_opportunities', 'created_at'),
    listTable('sales_quotes', 'created_at'),
    listTable('sales_quote_items', 'created_at'),
    listTable('sales_orders', 'created_at'),
    listTable('sales_order_items', 'created_at')
  ]);

  const openOrders = orders.data.filter((item) => !['finished', 'cancelled', 'returned'].includes(item.status));
  const approvedOpportunities = opportunities.data.filter((item) => item.stage === 'approved').length;
  const quoteConversion = quotes.data.length > 0
    ? Math.round((orders.data.length / quotes.data.length) * 100)
    : 0;
  const pipelineValue = opportunities.data.reduce((sum, item) => sum + Number(item.estimated_value_cents || 0), 0);
  const orderRevenue = orders.data.reduce((sum, item) => sum + Number(item.total_cents || 0), 0);

  res.json({
    source: customers.source,
    metrics: {
      customers: customers.data.length,
      opportunities: opportunities.data.length,
      approvedOpportunities,
      quotes: quotes.data.length,
      quoteConversion,
      orders: orders.data.length,
      openOrders: openOrders.length,
      pipelineValue,
      orderRevenue
    },
    customers,
    opportunities,
    quotes,
    quoteItems,
    orders,
    orderItems
  });
});

app.get('/api/admin/finance', requireAdminAuth, async (_req, res) => {
  const [receivable, payable, cashFlow, categories, costCenters, bankAccounts] = await Promise.all([
    listTable('accounts_receivable', 'due_date'),
    listTable('accounts_payable', 'due_date'),
    listTable('cash_flow_entries', 'entry_date'),
    listTable('financial_categories', 'created_at'),
    listTable('cost_centers', 'created_at'),
    listTable('bank_accounts', 'created_at')
  ]);

  const receivableOpen = receivable.data.filter((item) => item.status === 'pending' || item.status === 'partial');
  const payableOpen = payable.data.filter((item) => item.status === 'pending' || item.status === 'partial');
  const totalReceivable = receivableOpen.reduce((sum, item) => sum + Number(item.net_amount_cents || 0), 0);
  const totalPayable = payableOpen.reduce((sum, item) => sum + Number(item.net_amount_cents || item.amount_cents || 0), 0);
  const projectedBalance = totalReceivable - totalPayable;

  res.json({
    source: receivable.source,
    metrics: {
      receivableOpen: receivableOpen.length,
      payableOpen: payableOpen.length,
      totalReceivable,
      totalPayable,
      projectedBalance,
      cashFlowEntries: cashFlow.data.length
    },
    receivable,
    payable,
    cashFlow,
    categories,
    costCenters,
    bankAccounts
  });
});

app.get('/api/admin/reports/dre', requireAdminAuth, async (_req, res) => {
  res.json(await buildDreReport());
});

app.get('/api/admin/reports', requireAdminAuth, async (_req, res) => {
  res.json(await buildReports());
});

app.get('/api/admin/reports/:type.csv', requireAdminAuth, async (req, res) => {
  const definition = reportExports[req.params.type];
  if (!definition) {
    return res.status(404).json({ error: 'Relatório não encontrado.' });
  }

  const reports = await buildReports();
  const rows = definition.getRows(reports);
  const csv = toCsv(rows, definition.columns);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}-aromas-da-biblia.csv"`);
  res.send(`\uFEFF${csv}`);
});

app.post('/api/admin/pricing/simulate', requireAdminAuth, (req, res) => {
  res.json(simulatePricing(req.body || {}));
});

app.get('/api/admin/notifications', requireAdminAuth, async (_req, res) => {
  res.json(await buildNotifications());
});

app.post('/api/admin/notifications', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable('notifications', req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/notifications/:id/read', requireAdminAuth, async (req, res) => {
  const result = await updateNotificationStatus(req.params.id, 'read', req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.post('/api/admin/notifications/:id/resolve', requireAdminAuth, async (req, res) => {
  const result = await updateNotificationStatus(req.params.id, 'resolved', req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.get('/api/admin/admin-control', requireAdminAuth, async (_req, res) => {
  res.json(await buildAdminControl());
});

app.get('/api/admin/settings', requireAdminAuth, async (_req, res) => {
  res.json(await listTable('settings', 'updated_at'));
});

app.put('/api/admin/settings/:key', requireAdminAuth, async (req, res) => {
  const result = await upsertSetting(req.params.key, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.get('/api/admin/audit-logs', requireAdminAuth, async (_req, res) => {
  res.json(await listTable('audit_logs', 'created_at'));
});

app.get('/api/admin/quality', requireAdminAuth, async (_req, res) => {
  res.json(await buildQualityData());
});

app.post('/api/admin/:table(product_batches|quality_checks|batch_trace_events)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/product-batches/:id/status', requireAdminAuth, async (req, res) => {
  const status = String(req.body?.status || '');
  if (!['quarantine', 'approved', 'rejected', 'released', 'recalled'].includes(status)) {
    return res.status(400).json({ error: 'Status de lote invalido.' });
  }

  if (!supabase) {
    return res.status(202).json({ data: { id: req.params.id, status }, source: 'fallback' });
  }

  const { data: before } = await supabase.from('product_batches').select('*').eq('id', req.params.id).maybeSingle();
  const { data, error } = await supabase
    .from('product_batches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) return res.status(404).json({ error: publicError(error) });

  await writeAuditLog({
    user: req.user,
    action: `batch_${status}`,
    table: 'product_batches',
    recordId: req.params.id,
    before,
    after: data
  });

  await supabase.from('batch_trace_events').insert({
    batch_id: req.params.id,
    event_type: `status_${status}`,
    description: `Status do lote alterado para ${status}.`,
    responsible: req.user?.email || 'Sistema'
  });

  res.json({ data, source: 'supabase' });
});

app.get('/api/admin/purchasing', requireAdminAuth, async (_req, res) => {
  res.json(await buildPurchasingData());
});

app.post('/api/admin/:table(purchase_requests|purchase_request_items|purchase_quotes|purchase_orders|purchase_order_items)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/purchase-orders/:id/receive', requireAdminAuth, async (req, res) => {
  const result = await receivePurchaseOrder(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.get('/api/admin/marketing', requireAdminAuth, async (_req, res) => {
  res.json(await buildMarketingData());
});

app.post('/api/admin/:table(marketing_campaigns|marketing_content_items|marketing_calendar_events|marketing_leads|marketing_results)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.get('/api/admin/logistics', requireAdminAuth, async (_req, res) => {
  res.json(await buildLogisticsData());
});

app.get('/api/admin/offers', requireAdminAuth, async (_req, res) => {
  res.json(await buildOfferData());
});

app.post('/api/admin/customer-subscriptions/:id/cycle', requireAdminAuth, async (req, res) => {
  const result = await generateSubscriptionCycle(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/subscription-cycles/:id/bill', requireAdminAuth, async (req, res) => {
  const result = await billSubscriptionCycle(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/:table(carriers|shipments|shipment_events|after_sales_followups|customer_feedback)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/shipments/:id/status', requireAdminAuth, async (req, res) => {
  const result = await updateShipmentStatus(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.get('/api/admin/:table(produtos|clientes|pedidos|estoque|campanhas|financeiro|custos)', requireAdminAuth, async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/admin/:table(produtos|clientes|pedidos|estoque|campanhas|financeiro|custos)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.get('/api/admin/:table(fragrances|products|raw_materials|packaging_items|suppliers|inventory_movements)', requireAdminAuth, async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/admin/:table(fragrances|products|raw_materials|packaging_items|suppliers|inventory_movements)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/inventory/movements', requireAdminAuth, async (req, res) => {
  const result = await createInventoryMovement(req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.get('/api/admin/:table(formulas|formula_versions|formula_items|production_orders)', requireAdminAuth, async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/admin/:table(formulas|formula_versions|formula_items|production_orders)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/production/orders/:id/complete', requireAdminAuth, async (req, res) => {
  const result = await completeProductionOrder(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.get('/api/admin/:table(customers|sales_opportunities|sales_quotes|sales_quote_items|sales_orders|sales_order_items)', requireAdminAuth, async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/admin/:table(customers|sales_opportunities|sales_quotes|sales_quote_items|sales_orders|sales_order_items)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.get('/api/admin/:table(product_kits|product_kit_items|subscription_plans|customer_subscriptions|subscription_cycles)', requireAdminAuth, async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/admin/:table(product_kits|product_kit_items|subscription_plans|customer_subscriptions|subscription_cycles)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.get('/api/admin/:table(financial_categories|cost_centers|bank_accounts|accounts_receivable|accounts_payable|cash_flow_entries)', requireAdminAuth, async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/admin/:table(financial_categories|cost_centers|bank_accounts|accounts_receivable|accounts_payable|cash_flow_entries)', requireAdminAuth, async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/sales/orders/:id/receivable', requireAdminAuth, async (req, res) => {
  const result = await createReceivableFromOrder(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.post('/api/admin/accounts-receivable/:id/receive', requireAdminAuth, async (req, res) => {
  const result = await receiveAccountReceivable(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.post('/api/admin/accounts-payable/:id/pay', requireAdminAuth, async (req, res) => {
  const result = await payAccountPayable(req.params.id, req.body || {}, req.user);
  if (result.validationError) {
    return res.status(result.validationError.status).json({ error: result.validationError.error });
  }
  res.status(result.source === 'supabase' ? 200 : 202).json(result);
});

app.get(['/admin', '/admin/*'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Aromas da Biblia rodando na porta ${port}`);
});
