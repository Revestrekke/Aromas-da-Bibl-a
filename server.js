const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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
  res.json({
    negocio: 'Aromas da Biblia',
    fase: 'Plano de negocios evoluindo para sistema',
    indicadores: {
      receitaProjetada: 18500,
      margemBruta: 62,
      produtosAtivos: 4,
      pedidosMes: 128
    },
    proximosModulos: [
      'Produtos',
      'Pedidos',
      'Clientes',
      'Financeiro',
      'Estoque',
      'Campanhas'
    ]
  });
});

app.get('/api/produtos', async (_req, res) => {
  if (!supabase) {
    return res.json([
      {
        id: 'paz',
        nome: 'Paz',
        referencia: 'Joao 14:27',
        notas: ['Lavanda', 'Camomila', 'Musk'],
        tipo: 'Home Spray',
        volume: '200 ml',
        status: 'Protótipo'
      }
    ]);
  }

  const { data, error } = await supabase.from('produtos').select('*').order('nome');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Aromas da Biblia rodando na porta ${port}`);
});
