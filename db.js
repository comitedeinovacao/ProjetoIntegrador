// ═══════════════════════════════════════════════════════════════════
//  db.js — Hub de Projetos · Camada de dados: localStorage + Google Sheets
//  Instrução: após implantar o Apps Script, cole a URL em GAS_URL.
// ═══════════════════════════════════════════════════════════════════

/**
 * Formata uma data ISO (ex: "2026-03-29T18:00:00Z") ou YYYY-MM-DD
 * para exibição em pt-BR sem risco de fuso horário inverter o dia.
 * Exemplo: formatDate("2026-03-29") → "29/03/2026"
 */
function formatDate(value, opts) {
  if (!value) return '—';
  // Se vier como YYYY-MM-DD (sem hora), adiciona T12:00 para evitar
  // que o JavaScript interprete como meia-noite UTC (que no Brasil vira dia anterior)
  const safe = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value;
  return new Date(safe).toLocaleDateString('pt-BR', opts || { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const GAS_URL    = 'https://script.google.com/macros/s/AKfycbxZyUKKLobm59Egj561BFQDrlctQp9cy9t2jqxAs8AV6sJnXKyFfEOoVQJQkRNyGeOvRA/exec';
const GAS_SECRET = 'pi_senac_2025';

const DB_KEYS = [
  'pi_grupos',
  'pi_config',
  'pi_materiais',
  'pi_feedback_coletivo',
  'pi_trocas'
];

/**
 * Busca todos os dados do Google Sheets e atualiza localStorage.
 * Aplica migrações de configuração após a sincronização para garantir
 * que valores legados na nuvem não sobrescrevam os corretos localmente.
 * Retorna true se sincronizou com sucesso, false se falhou.
 */
async function cloudSync() {
  if (!GAS_URL) return false;
  try {
    const res  = await fetch(GAS_URL + '?action=getAll', { cache: 'no-store' });
    const json = await res.json();
    if (!json.ok || !json.data) return false;
    DB_KEYS.forEach(k => {
      if (json.data[k] !== undefined && json.data[k] !== null) {
        localStorage.setItem(k, JSON.stringify(json.data[k]));
      }
    });
    _migrarConfigPos();
    return true;
  } catch {
    return false;
  }
}

/**
 * Corrige valores legados de pi_config após sync com a nuvem.
 * Se houver mudanças, reenvia o config corrigido para o Google Sheets.
 */
function _migrarConfigPos() {
  try {
    const cfg = JSON.parse(localStorage.getItem('pi_config') || '{}');
    let mudou = false;
    if (cfg.nomeCurso === 'Técnico em Logística') {
      cfg.nomeCurso = 'Metodologias de Trabalho por Projetos Integradores';
      mudou = true;
    }
    if (cfg.unidade && !cfg.unidade.toLowerCase().startsWith('senac')) {
      cfg.unidade = 'Senac ' + cfg.unidade;
      mudou = true;
    }
    if (mudou) {
      localStorage.setItem('pi_config', JSON.stringify(cfg));
      cloudSave('pi_config');
    }
  } catch {}
}

/**
 * Salva uma chave no Google Sheets em background (fire & forget).
 * Sempre salva no localStorage primeiro; a nuvem é atualizada de forma assíncrona.
 */
function cloudSave(key) {
  if (!GAS_URL) return;
  const value = JSON.parse(localStorage.getItem(key) || 'null');
  fetch(GAS_URL, {
    method : 'POST',
    mode   : 'no-cors',
    body   : JSON.stringify({ action: 'save', secret: GAS_SECRET, key, value })
  }).catch(() => {});
}

/**
 * Utilitários globais para pi_grupos.
 */
function saveGrupos(grupos) {
  localStorage.setItem('pi_grupos', JSON.stringify(grupos));
  cloudSave('pi_grupos');
}

function getGruposDB() {
  return JSON.parse(localStorage.getItem('pi_grupos') || '[]');
}
