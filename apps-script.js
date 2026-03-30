// ═══════════════════════════════════════════════════════════════════
//  PI Logística — Google Apps Script (Back-end da planilha)
//  Como usar:
//  1. Abra o Google Sheets → Extensões → Apps Script
//  2. Apague o conteúdo padrão e cole TODO este código
//  3. Clique em Implantar → Nova implantação
//     - Tipo: App da Web
//     - Executar como: Eu mesmo
//     - Quem tem acesso: Qualquer pessoa
//  4. Copie a URL gerada e cole em db.js na variável GAS_URL
// ═══════════════════════════════════════════════════════════════════

const SECRET     = 'pi_senac_2025';
const SHEET_NAME = 'dados';

// ── GET: leitura pública de todos os dados ───────────────────────
function doGet(e) {
  if (e.parameter.action === 'getAll') return getAllData();
  return ok({ msg: 'PI Logística API v1' });
}

// ── POST: escrita protegida por SECRET ───────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET)       return ok({ error: 'unauthorized' });
    if (body.action === 'save')       return setKey(body.key, body.value);
  } catch (err) {
    return ok({ error: err.message });
  }
  return ok({ error: 'unknown action' });
}

// ── Lê todas as chaves da planilha ───────────────────────────────
function getAllData() {
  const sheet = getSheet();
  const rows  = sheet.getDataRange().getValues().slice(1); // pula cabeçalho
  const data  = {};
  rows.forEach(r => {
    if (!r[0]) return;
    try { data[r[0]] = JSON.parse(r[1]); }
    catch { data[r[0]] = null; }
  });
  return ok({ data });
}

// ── Grava ou atualiza uma chave na planilha ──────────────────────
function setKey(key, value) {
  const sheet = getSheet();
  const rows  = sheet.getDataRange().getValues();
  const now   = new Date().toISOString();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(value));
      sheet.getRange(i + 1, 3).setValue(now);
      return ok({});
    }
  }
  // Chave não encontrada — adiciona nova linha
  sheet.appendRow([key, JSON.stringify(value), now]);
  return ok({});
}

// ── Garante que a aba "dados" existe com cabeçalho ───────────────
function getSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([['Chave', 'Valor', 'Atualizado']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 600);
    sheet.setColumnWidth(3, 200);
  }
  return sheet;
}

// ── Resposta JSON padrão ─────────────────────────────────────────
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}
