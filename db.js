// ═══════════════════════════════════════════════════════════════════
//  db.js — PI Logística · Camada de dados: localStorage + Google Sheets
//  Instrução: após implantar o Apps Script, cole a URL em GAS_URL.
// ═══════════════════════════════════════════════════════════════════

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
    return true;
  } catch {
    return false;
  }
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
