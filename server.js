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
  sales_order_items: [
    { id: 'order-item-001', order_id: 'order-001', product_id: 'product-paz', description: 'Home Spray Paz 200 ml', quantity: 20, unit_price_cents: 6990, total_cents: 139800, unit_cost_cents: 3050, margin_cents: 78800 }
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
  sales_order_items: {
    required: ['order_id', 'description', 'quantity'],
    numeric: ['quantity', 'unit_price_cents', 'discount_cents', 'total_cents', 'unit_cost_cents', 'margin_cents']
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

  const patch = {
    status: 'finished',
    produced_quantity: Number(payload.produced_quantity || approvedQuantity),
    approved_quantity: approvedQuantity,
    lost_quantity: Number(payload.lost_quantity || 0),
    loss_reason: payload.loss_reason || null,
    completed_at: new Date().toISOString(),
    generated_lot: payload.generated_lot || `LOTE-${order.order_number}`,
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

app.post('/api/admin/pricing/simulate', requireAdminAuth, (req, res) => {
  res.json(simulatePricing(req.body || {}));
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

app.get(['/admin', '/admin/*'], (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Aromas da Biblia rodando na porta ${port}`);
});
