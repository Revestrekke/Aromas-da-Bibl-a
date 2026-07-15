const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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
  ]
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

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

async function insertIntoTable(table, payload) {
  const record = {
    id: payload.id || normalizeId(payload.nome || payload.item || payload.cliente || randomUUID()),
    ...payload
  };

  if (!supabase) {
    return { data: record, source: 'fallback' };
  }

  const { data, error } = await supabase.from(table).insert(record).select('*').single();
  if (error) {
    return { data: record, source: 'fallback', supabaseError: publicError(error) };
  }

  return { data, source: 'supabase' };
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

app.get('/api/dashboard', async (_req, res) => {
  const [produtos, pedidos, estoque, financeiro, campanhas] = await Promise.all([
    listTable('produtos', 'nome'),
    listTable('pedidos', 'created_at'),
    listTable('estoque', 'item'),
    listTable('financeiro', 'created_at'),
    listTable('campanhas', 'created_at')
  ]);

  const receitaProjetada = financeiro.data.reduce((sum, item) => sum + Number(item.receita || 0), 0);
  const custosProjetados = financeiro.data.reduce((sum, item) => sum + Number(item.custos || 0), 0);
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
      estoqueCritico
    },
    proximosModulos: ['Produtos', 'Pedidos', 'Clientes', 'Financeiro', 'Estoque', 'Campanhas']
  });
});

app.get('/api/system', async (_req, res) => {
  const entries = await Promise.all(
    Object.keys(fallbackData).map(async (table) => [table, await listTable(table)])
  );

  res.json(Object.fromEntries(entries));
});

app.get('/api/:table(produtos|clientes|pedidos|estoque|campanhas|financeiro)', async (req, res) => {
  const result = await listTable(req.params.table);
  res.json(result);
});

app.post('/api/:table(produtos|clientes|pedidos|estoque|campanhas|financeiro)', async (req, res) => {
  const result = await insertIntoTable(req.params.table, req.body || {});
  res.status(result.source === 'supabase' ? 201 : 202).json(result);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Aromas da Biblia rodando na porta ${port}`);
});
