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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, limit: 240 }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const moneyFields = new Set([
  'sale_price_cents',
  'unit_cost_cents',
  'freight_cents',
  'total_cents',
  'amount_cents',
  'supplies_cost_cents',
  'packaging_cost_cents',
  'total_cost_cents',
  'unit_cost_total_cents',
  'margin_cents'
]);

const resources = {
  products: {
    table: 'products',
    order: 'name',
    required: ['name', 'code'],
    numeric: ['volume', 'sale_price_cents', 'current_stock', 'minimum_stock'],
    searchable: ['name', 'code', 'aroma']
  },
  supplies: {
    table: 'supplies',
    order: 'name',
    required: ['name', 'category', 'unit'],
    numeric: ['quantity_on_hand', 'minimum_stock', 'unit_cost_cents'],
    searchable: ['name', 'category', 'supplier_name']
  },
  packaging: {
    table: 'packaging',
    order: 'name',
    required: ['name', 'type'],
    numeric: ['quantity_on_hand', 'minimum_stock', 'unit_cost_cents'],
    searchable: ['name', 'type', 'supplier_name']
  },
  suppliers: {
    table: 'suppliers',
    order: 'name',
    required: ['name'],
    numeric: [],
    searchable: ['name', 'contact_name']
  },
  purchases: {
    table: 'purchases',
    order: 'purchase_date',
    required: ['purchase_date', 'supplier_id', 'item_type', 'item_id', 'quantity', 'unit_cost_cents'],
    numeric: ['quantity', 'unit_cost_cents', 'freight_cents', 'total_cents'],
    searchable: ['supplier_name', 'notes']
  },
  financial_entries: {
    table: 'financial_entries',
    order: 'entry_date',
    required: ['entry_date', 'type', 'description', 'category', 'amount_cents'],
    numeric: ['amount_cents'],
    searchable: ['description', 'category', 'payment_method']
  }
};

function publicError(error) {
  return error?.message || 'Erro inesperado.';
}

function cents(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number) || number < 0) return null;
  return Math.round(number);
}

function numberValue(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number) || number < 0) return null;
  return number;
}

function addDays(dateText, days) {
  const date = dateText ? new Date(dateText) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function requireAdminAuth(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no Render.' });
  }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Login administrativo necessario.' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Sessao invalida.' });

  req.user = data.user;
  next();
}

function cleanPayload(resource, body) {
  const def = resources[resource];
  const payload = { ...body };
  delete payload.created_at;
  delete payload.updated_at;

  for (const field of def.required) {
    if (!String(payload[field] ?? '').trim()) {
      return { error: `Campo obrigatorio: ${field}.` };
    }
  }

  for (const field of def.numeric) {
    if (payload[field] === undefined || payload[field] === '') continue;
    const value = moneyFields.has(field) ? cents(payload[field]) : numberValue(payload[field]);
    if (value === null) return { error: `Valor invalido em ${field}.` };
    payload[field] = value;
  }

  if (resource === 'products') {
    payload.active = payload.active === true || payload.active === 'true';
    payload.current_stock = Number(payload.current_stock || 0);
    payload.minimum_stock = Number(payload.minimum_stock || 0);
    payload.internal_code = payload.internal_code || payload.code;
    payload.sku = payload.sku || payload.code;
    payload.category = payload.category || payload.aroma || 'Produto';
    payload.status = payload.active ? 'active' : 'inactive';
    payload.active_on_site = payload.active;
  }

  if (resource === 'suppliers') {
    payload.trade_name = payload.trade_name || payload.name;
    payload.status = payload.status || 'active';
  }

  if (resource === 'financial_entries') {
    if (!['entrada', 'saida'].includes(payload.type)) return { error: 'Tipo financeiro invalido.' };
    if (!['pendente', 'pago'].includes(payload.status || 'pendente')) payload.status = 'pendente';
  }

  if (resource === 'purchases') {
    if (!['supply', 'packaging'].includes(payload.item_type)) return { error: 'Tipo de compra invalido.' };
    if (!['pendente', 'pago'].includes(payload.status || 'pendente')) payload.status = 'pendente';
    payload.freight_cents = Number(payload.freight_cents || 0);
    payload.total_cents =
      payload.total_cents || Math.round(Number(payload.quantity || 0) * Number(payload.unit_cost_cents || 0) + payload.freight_cents);
  }

  return { payload };
}

function tableForInventoryType(itemType) {
  if (itemType === 'supply') return 'supplies';
  if (itemType === 'packaging') return 'packaging';
  throw new Error('Tipo de item invalido.');
}

async function listResource(resource, query = {}) {
  const def = resources[resource];
  let request = supabase.from(def.table).select('*');

  if (query.status && resource === 'products') request = request.eq('active', query.status === 'active');
  if (query.status && ['purchases', 'financial_entries'].includes(resource)) request = request.eq('status', query.status);
  if (query.type && resource === 'financial_entries') request = request.eq('type', query.type);
  if (query.supplier_id && resource === 'purchases') request = request.eq('supplier_id', query.supplier_id);
  if (query.from && ['purchases', 'financial_entries'].includes(resource)) {
    request = request.gte(resource === 'purchases' ? 'purchase_date' : 'entry_date', query.from);
  }
  if (query.to && ['purchases', 'financial_entries'].includes(resource)) {
    request = request.lte(resource === 'purchases' ? 'purchase_date' : 'entry_date', query.to);
  }

  request = request.order(def.order, { ascending: resource !== 'financial_entries' && resource !== 'purchases' });
  const { data, error } = await request;
  if (error) throw error;

  const search = String(query.search || '').trim().toLowerCase();
  if (!search) return data || [];
  return (data || []).filter((row) =>
    def.searchable.some((field) => String(row[field] || '').toLowerCase().includes(search))
  );
}

async function writeAuditUser(user) {
  await supabase.from('users').upsert({
    id: user.id,
    email: user.email || null,
    name: user.user_metadata?.name || user.email || null,
    last_login_at: new Date().toISOString()
  }, { onConflict: 'id' });
}

async function createResource(resource, body, user) {
  const { payload, error } = cleanPayload(resource, body);
  if (error) return { validationError: error };
  const record = { id: payload.id || randomUUID(), ...payload };

  if (resource === 'purchases') return createPurchase(record, user);

  const { data, error: dbError } = await supabase.from(resources[resource].table).insert(record).select('*').single();
  if (dbError) return { dbError };
  return { data };
}

async function updateResource(resource, id, body, user) {
  const { payload, error } = cleanPayload(resource, body);
  if (error) return { validationError: error };

  if (resource === 'purchases') return updatePurchase(id, payload, user);

  const { data, error: dbError } = await supabase
    .from(resources[resource].table)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (dbError) return { dbError };
  return { data };
}

async function deleteResource(resource, id) {
  if (resource === 'purchases') return deletePurchase(id);

  const { error } = await supabase.from(resources[resource].table).delete().eq('id', id);
  if (error) return { dbError: error };
  return { data: { id } };
}

async function moveInventory({ itemType, itemId, quantity, direction, reason, referenceType, referenceId, unitCostCents, user }) {
  const table = tableForInventoryType(itemType);
  const qty = Number(quantity || 0);
  if (qty <= 0) return { validationError: 'Quantidade deve ser maior que zero.' };

  const { data: item, error } = await supabase.from(table).select('*').eq('id', itemId).maybeSingle();
  if (error) return { dbError: error };
  if (!item) return { validationError: 'Item de estoque nao encontrado.' };

  const before = Number(item.quantity_on_hand || 0);
  const delta = direction === 'in' ? qty : -qty;
  const after = before + delta;
  if (after < 0) return { validationError: 'Movimento geraria estoque negativo.' };

  const patch = { quantity_on_hand: after, updated_at: new Date().toISOString() };
  if (direction === 'in' && unitCostCents !== undefined) patch.unit_cost_cents = Number(unitCostCents || item.unit_cost_cents || 0);

  const { error: updateError } = await supabase.from(table).update(patch).eq('id', itemId);
  if (updateError) return { dbError: updateError };

  const movement = {
    item_type: itemType,
    item_id: itemId,
    movement_type: direction,
    quantity: qty,
    quantity_before: before,
    quantity_after: after,
    reason,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
    created_by: user?.id || null
  };

  const { data, error: movementError } = await supabase.from('inventory_movements').insert(movement).select('*').single();
  if (movementError) return { dbError: movementError };
  return { data };
}

async function reversePurchaseImpact(purchase, user) {
  const { data: items, error } = await supabase.from('purchase_items').select('*').eq('purchase_id', purchase.id);
  if (error) return { dbError: error };

  for (const item of items || []) {
    const movement = await moveInventory({
      itemType: purchase.item_type,
      itemId: item.item_id,
      quantity: item.quantity,
      direction: 'out',
      reason: `Estorno da compra ${purchase.id}`,
      referenceType: 'purchase_reversal',
      referenceId: purchase.id,
      user
    });
    if (movement.validationError || movement.dbError) return movement;
  }

  const { error: financialError } = await supabase.from('financial_entries').delete().eq('purchase_id', purchase.id);
  if (financialError) return { dbError: financialError };
  return { ok: true };
}

async function applyPurchaseImpact(purchase, user) {
  const item = {
    purchase_id: purchase.id,
    item_type: purchase.item_type,
    item_id: purchase.item_id,
    quantity: purchase.quantity,
    unit: purchase.unit || null,
    unit_cost_cents: purchase.unit_cost_cents,
    total_cents: Math.round(Number(purchase.quantity || 0) * Number(purchase.unit_cost_cents || 0))
  };

  const { error: itemError } = await supabase.from('purchase_items').insert(item);
  if (itemError) return { dbError: itemError };

  const movement = await moveInventory({
    itemType: purchase.item_type,
    itemId: purchase.item_id,
    quantity: purchase.quantity,
    direction: 'in',
    reason: `Compra ${purchase.id}`,
    referenceType: 'purchase',
    referenceId: purchase.id,
    unitCostCents: purchase.unit_cost_cents,
    user
  });
  if (movement.validationError || movement.dbError) return movement;

  const financial = {
    purchase_id: purchase.id,
    entry_date: purchase.purchase_date,
    type: 'saida',
    description: `Compra - ${purchase.supplier_name || 'fornecedor'}`,
    category: purchase.item_type === 'supply' ? 'compras de insumos' : 'compras de embalagens',
    amount_cents: purchase.total_cents,
    payment_method: purchase.payment_method || null,
    status: purchase.status,
    notes: purchase.notes || null
  };

  const { error: financialError } = await supabase.from('financial_entries').insert(financial);
  if (financialError) return { dbError: financialError };
  return { ok: true };
}

async function createPurchase(payload, user) {
  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('supplier_id', payload.supplier_id)
    .eq('item_type', payload.item_type)
    .eq('item_id', payload.item_id)
    .eq('purchase_date', payload.purchase_date)
    .eq('quantity', payload.quantity)
    .eq('unit_cost_cents', payload.unit_cost_cents)
    .maybeSingle();

  if (existing) return { validationError: 'Compra duplicada.' };

  const supplier = await supabase.from('suppliers').select('name').eq('id', payload.supplier_id).maybeSingle();
  const record = {
    id: payload.id || randomUUID(),
    ...payload,
    supplier_name: supplier.data?.name || null,
    applied_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('purchases').insert(record).select('*').single();
  if (error) return { dbError: error };

  const applied = await applyPurchaseImpact(data, user);
  if (applied.validationError || applied.dbError) return applied;
  return { data };
}

async function updatePurchase(id, payload, user) {
  const { data: oldPurchase, error: oldError } = await supabase.from('purchases').select('*').eq('id', id).maybeSingle();
  if (oldError) return { dbError: oldError };
  if (!oldPurchase) return { validationError: 'Compra nao encontrada.' };

  const reversed = await reversePurchaseImpact(oldPurchase, user);
  if (reversed.validationError || reversed.dbError) return reversed;
  await supabase.from('purchase_items').delete().eq('purchase_id', id);

  const supplier = await supabase.from('suppliers').select('name').eq('id', payload.supplier_id).maybeSingle();
  const patch = {
    ...payload,
    supplier_name: supplier.data?.name || oldPurchase.supplier_name,
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('purchases').update(patch).eq('id', id).select('*').single();
  if (error) return { dbError: error };

  const applied = await applyPurchaseImpact(data, user);
  if (applied.validationError || applied.dbError) return applied;
  return { data };
}

async function deletePurchase(id, user) {
  const { data: purchase, error } = await supabase.from('purchases').select('*').eq('id', id).maybeSingle();
  if (error) return { dbError: error };
  if (!purchase) return { validationError: 'Compra nao encontrada.' };

  const reversed = await reversePurchaseImpact(purchase, user);
  if (reversed.validationError || reversed.dbError) return reversed;
  await supabase.from('purchase_items').delete().eq('purchase_id', id);

  const { error: deleteError } = await supabase.from('purchases').delete().eq('id', id);
  if (deleteError) return { dbError: deleteError };
  return { data: { id } };
}

async function listFormulas() {
  const [{ data: formulas, error }, { data: products }, { data: formulaSupplies }, { data: formulaPackaging }, { data: supplies }, { data: packaging }] =
    await Promise.all([
      supabase.from('formulas').select('*').order('name'),
      supabase.from('products').select('id,name,sale_price_cents'),
      supabase.from('formula_supplies').select('*'),
      supabase.from('formula_packaging').select('*'),
      supabase.from('supplies').select('id,name,unit_cost_cents'),
      supabase.from('packaging').select('id,name,unit_cost_cents')
    ]);
  if (error) throw error;

  return (formulas || []).map((formula) => {
    const product = (products || []).find((item) => item.id === formula.product_id);
    return {
      ...formula,
      product_name: product?.name || null,
      supplies: (formulaSupplies || []).filter((item) => item.formula_id === formula.id),
      packaging: (formulaPackaging || []).filter((item) => item.formula_id === formula.id),
      supplies_catalog: supplies || [],
      packaging_catalog: packaging || []
    };
  });
}

function calculateFormulaCosts(payload, suppliesCatalog, packagingCatalog) {
  const yieldQuantity = Number(payload.yield_quantity || 0);
  if (yieldQuantity <= 0) return { error: 'Rendimento deve ser maior que zero.' };

  let suppliesCost = 0;
  for (const item of payload.supplies || []) {
    const supply = suppliesCatalog.find((entry) => entry.id === item.supply_id);
    suppliesCost += Math.round(Number(item.quantity || 0) * Number(supply?.unit_cost_cents || 0));
  }

  let packagingCost = 0;
  for (const item of payload.packaging || []) {
    const pack = packagingCatalog.find((entry) => entry.id === item.packaging_id);
    packagingCost += Math.round(Number(item.quantity || 0) * Number(pack?.unit_cost_cents || 0));
  }

  const total = suppliesCost + packagingCost;
  return {
    supplies_cost_cents: suppliesCost,
    packaging_cost_cents: packagingCost,
    total_cost_cents: total,
    unit_cost_total_cents: Math.round(total / yieldQuantity)
  };
}

async function saveFormula(payload, id = null) {
  if (!payload.product_id) return { validationError: 'Formula precisa estar vinculada a um produto.' };
  if (!String(payload.name || '').trim()) return { validationError: 'Informe o nome da formula.' };
  if (Number(payload.yield_quantity || 0) <= 0) return { validationError: 'Rendimento deve ser maior que zero.' };

  const [{ data: product }, { data: supplies }, { data: packaging }] = await Promise.all([
    supabase.from('products').select('*').eq('id', payload.product_id).maybeSingle(),
    supabase.from('supplies').select('*'),
    supabase.from('packaging').select('*')
  ]);

  if (!product) return { validationError: 'Produto da formula nao encontrado.' };
  const costs = calculateFormulaCosts(payload, supplies || [], packaging || []);
  if (costs.error) return { validationError: costs.error };

  const formulaPayload = {
    name: payload.name,
    product_id: payload.product_id,
    yield_quantity: Number(payload.yield_quantity),
    notes: payload.notes || null,
    ...costs,
    margin_cents: Number(product.sale_price_cents || 0) - costs.unit_cost_total_cents,
    updated_at: new Date().toISOString()
  };

  let formula;
  if (id) {
    const result = await supabase.from('formulas').update(formulaPayload).eq('id', id).select('*').single();
    if (result.error) return { dbError: result.error };
    formula = result.data;
    await supabase.from('formula_supplies').delete().eq('formula_id', id);
    await supabase.from('formula_packaging').delete().eq('formula_id', id);
  } else {
    const result = await supabase.from('formulas').insert({ id: randomUUID(), ...formulaPayload }).select('*').single();
    if (result.error) return { dbError: result.error };
    formula = result.data;
  }

  const formulaSupplies = (payload.supplies || []).map((item) => {
    const supply = (supplies || []).find((entry) => entry.id === item.supply_id);
    return {
      formula_id: formula.id,
      supply_id: item.supply_id,
      quantity: Number(item.quantity || 0),
      unit: item.unit || supply?.unit || null,
      cost_cents: Math.round(Number(item.quantity || 0) * Number(supply?.unit_cost_cents || 0))
    };
  });

  const formulaPackaging = (payload.packaging || []).map((item) => {
    const pack = (packaging || []).find((entry) => entry.id === item.packaging_id);
    return {
      formula_id: formula.id,
      packaging_id: item.packaging_id,
      quantity: Number(item.quantity || 0),
      cost_cents: Math.round(Number(item.quantity || 0) * Number(pack?.unit_cost_cents || 0))
    };
  });

  if (formulaSupplies.length) await supabase.from('formula_supplies').insert(formulaSupplies);
  if (formulaPackaging.length) await supabase.from('formula_packaging').insert(formulaPackaging);

  await supabase.from('products').update({ formula_id: formula.id, updated_at: new Date().toISOString() }).eq('id', product.id);
  return { data: formula };
}

async function summary() {
  const start = new Date();
  start.setDate(1);
  const from = start.toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const [purchases, financial, products, supplies, packaging] = await Promise.all([
    supabase.from('purchases').select('*').gte('purchase_date', from).lte('purchase_date', to),
    supabase.from('financial_entries').select('*').gte('entry_date', from).lte('entry_date', to),
    supabase.from('products').select('*'),
    supabase.from('supplies').select('*'),
    supabase.from('packaging').select('*')
  ]);

  for (const result of [purchases, financial, products, supplies, packaging]) {
    if (result.error) throw result.error;
  }

  const entries = financial.data || [];
  const inputs = entries.filter((item) => item.type === 'entrada').reduce((sum, item) => sum + Number(item.amount_cents || 0), 0);
  const expenses = entries.filter((item) => item.type === 'saida').reduce((sum, item) => sum + Number(item.amount_cents || 0), 0);

  return {
    month: { from, to },
    purchasesTotal: (purchases.data || []).reduce((sum, item) => sum + Number(item.total_cents || 0), 0),
    expensesTotal: expenses,
    incomeTotal: inputs,
    balance: inputs - expenses,
    productsCount: (products.data || []).length,
    lowSupplies: (supplies.data || []).filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0)),
    lowPackaging: (packaging.data || []).filter((item) => Number(item.quantity_on_hand || 0) <= Number(item.minimum_stock || 0))
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, supabase: Boolean(supabase), scope: 'simple-internal-system' });
});

app.get('/api/config', (_req, res) => {
  res.json({ supabaseUrl: supabaseUrl || null, supabaseAnonKey: supabaseAnonKey || null });
});

app.use('/api/admin/simple', requireAdminAuth, async (req, _res, next) => {
  await writeAuditUser(req.user);
  next();
});

app.get('/api/admin/simple/summary', requireAdminAuth, async (_req, res) => {
  try {
    res.json(await summary());
  } catch (error) {
    res.status(500).json({ error: publicError(error) });
  }
});

app.get('/api/admin/simple/formulas', requireAdminAuth, async (_req, res) => {
  try {
    res.json({ data: await listFormulas() });
  } catch (error) {
    res.status(500).json({ error: publicError(error) });
  }
});

app.post('/api/admin/simple/formulas', requireAdminAuth, async (req, res) => {
  const result = await saveFormula(req.body || {});
  if (result.validationError) return res.status(400).json({ error: result.validationError });
  if (result.dbError) return res.status(400).json({ error: publicError(result.dbError) });
  res.status(201).json(result);
});

app.put('/api/admin/simple/formulas/:id', requireAdminAuth, async (req, res) => {
  const result = await saveFormula(req.body || {}, req.params.id);
  if (result.validationError) return res.status(400).json({ error: result.validationError });
  if (result.dbError) return res.status(400).json({ error: publicError(result.dbError) });
  res.json(result);
});

app.delete('/api/admin/simple/formulas/:id', requireAdminAuth, async (req, res) => {
  const { error } = await supabase.from('formulas').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: publicError(error) });
  res.json({ data: { id: req.params.id } });
});

app.get('/api/admin/simple/:resource', requireAdminAuth, async (req, res) => {
  const resource = req.params.resource;
  if (!resources[resource]) return res.status(404).json({ error: 'Recurso nao encontrado.' });
  try {
    res.json({ data: await listResource(resource, req.query) });
  } catch (error) {
    res.status(500).json({ error: publicError(error) });
  }
});

app.post('/api/admin/simple/:resource', requireAdminAuth, async (req, res) => {
  const resource = req.params.resource;
  if (!resources[resource]) return res.status(404).json({ error: 'Recurso nao encontrado.' });
  const result = await createResource(resource, req.body || {}, req.user);
  if (result.validationError) return res.status(400).json({ error: result.validationError });
  if (result.dbError) return res.status(400).json({ error: publicError(result.dbError) });
  res.status(201).json(result);
});

app.put('/api/admin/simple/:resource/:id', requireAdminAuth, async (req, res) => {
  const resource = req.params.resource;
  if (!resources[resource]) return res.status(404).json({ error: 'Recurso nao encontrado.' });
  const result = await updateResource(resource, req.params.id, req.body || {}, req.user);
  if (result.validationError) return res.status(400).json({ error: result.validationError });
  if (result.dbError) return res.status(400).json({ error: publicError(result.dbError) });
  res.json(result);
});

app.delete('/api/admin/simple/:resource/:id', requireAdminAuth, async (req, res) => {
  const resource = req.params.resource;
  if (!resources[resource]) return res.status(404).json({ error: 'Recurso nao encontrado.' });
  const result = await deleteResource(resource, req.params.id, req.user);
  if (result.validationError) return res.status(400).json({ error: result.validationError });
  if (result.dbError) return res.status(400).json({ error: publicError(result.dbError) });
  res.json(result);
});

app.post('/api/admin/simple/:resource/:id/stock', requireAdminAuth, async (req, res) => {
  const itemType = req.params.resource === 'supplies' ? 'supply' : req.params.resource === 'packaging' ? 'packaging' : null;
  if (!itemType) return res.status(404).json({ error: 'Estoque disponivel apenas para insumos e embalagens.' });

  const movement = await moveInventory({
    itemType,
    itemId: req.params.id,
    quantity: req.body?.quantity,
    direction: req.body?.direction,
    reason: req.body?.reason || 'Ajuste manual',
    referenceType: 'manual',
    referenceId: null,
    unitCostCents: req.body?.unit_cost_cents,
    user: req.user
  });

  if (movement.validationError) return res.status(400).json({ error: movement.validationError });
  if (movement.dbError) return res.status(400).json({ error: publicError(movement.dbError) });
  res.status(201).json(movement);
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
