/**
 * Contapezzi Evento – database di backup su Google Sheet
 *
 * 1. Cambia CHIAVE qui sotto con una parola segreta tua (la stessa che metterai nell'app).
 * 2. Esegui una volta la funzione "setup" (menu in alto ▶ Esegui) e concedi le autorizzazioni.
 * 3. Distribuisci → Nuova distribuzione → App web
 *      Esegui come: Me    ·    Chi ha accesso: Chiunque
 *    Copia l'URL che finisce con /exec e incollalo nell'app (scheda "Google Sheet").
 */
const CHIAVE = 'CAMBIA-QUESTA-CHIAVE';

const FOGLIO_SCANSIONI = 'Scansioni';
const FOGLIO_PRODOTTI = 'Prodotti';
const FOGLIO_RIEPILOGO = 'Riepilogo';
const INTESTAZIONI = ['ID', 'Data e ora', 'Cassa', 'Codice', 'Prodotto', 'Tipo', 'Prezzo applicato', 'Origine', 'Stato'];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sc = foglio_(FOGLIO_SCANSIONI);
  if (sc.getLastRow() === 0) {
    sc.appendRow(INTESTAZIONI);
    sc.setFrozenRows(1);
    sc.getRange('B:B').setNumberFormat('dd/mm/yyyy hh:mm:ss');
    sc.getRange('G:G').setNumberFormat('€ #,##0.00');
  }
  const pr = foglio_(FOGLIO_PRODOTTI);
  if (pr.getLastRow() === 0) {
    pr.appendRow(['Codice', 'Prodotto', 'Prezzo']);
    pr.setFrozenRows(1);
  }
  const ri = foglio_(FOGLIO_RIEPILOGO);
  ri.clear();
  ri.getRange('A1').setValue('Pezzi per tipologia (tutte le casse)').setFontWeight('bold');
  ri.getRange('A2').setFormula(
    "=IFERROR(QUERY(Scansioni!A:I,\"select D, count(D) where I = 'OK' and D is not null group by D pivot F label D 'Codice'\",1),\"Nessuna scansione\")");
  ri.getRange('G1').setValue('Totali per prodotto').setFontWeight('bold');
  ri.getRange('G2').setFormula(
    "=IFERROR(QUERY(Scansioni!A:I,\"select D, E, count(D), sum(G) where I = 'OK' and D is not null group by D, E label D 'Codice', E 'Prodotto', count(D) 'Pezzi', sum(G) 'Incasso'\",1),\"Nessuna scansione\")");
  ri.getRange('M1').setValue('Per cassa').setFontWeight('bold');
  ri.getRange('M2').setFormula(
    "=IFERROR(QUERY(Scansioni!A:I,\"select C, count(C), sum(G) where I = 'OK' and C is not null group by C label C 'Cassa', count(C) 'Pezzi', sum(G) 'Incasso'\",1),\"Nessuna scansione\")");
  const def = ss.getSheetByName('Foglio1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return risposta_({ ok: false, error: 'Richiesta non valida' }); }
  if (CHIAVE === 'CAMBIA-QUESTA-CHIAVE') return risposta_({ ok: false, error: 'Imposta la CHIAVE nello script e ridistribuiscilo' });
  if (body.key !== CHIAVE) return risposta_({ ok: false, error: 'Chiave non valida' });

  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    if (body.action === 'ping') return risposta_({ ok: true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
    if (body.action === 'sync') return risposta_(sincronizza_(body));
    if (body.action === 'restore') return risposta_(ripristina_(String(body.dev || '')));
    return risposta_({ ok: false, error: 'Azione sconosciuta' });
  } catch (err) {
    return risposta_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('Contapezzi Evento: lo script è attivo.');
}

function sincronizza_(body) {
  const sh = foglio_(FOGLIO_SCANSIONI);
  if (sh.getLastRow() === 0) setup();
  const ids = idPresenti_(sh);

  // Nuove scansioni (le ripetute vengono ignorate)
  const nuove = (body.scans || []).filter(function (s) { return s && s.id && !ids.has(String(s.id)); }).map(function (s) {
    return [String(s.id), new Date(Number(s.t)), String(s.dev || ''), String(s.code), String(s.name || ''),
            String(s.type || ''), Number(s.unit) || 0, String(s.src || ''), 'OK'];
  });
  if (nuove.length) sh.getRange(sh.getLastRow() + 1, 1, nuove.length, INTESTAZIONI.length).setValues(nuove);

  // Annullamenti: la riga resta, lo stato diventa ANNULLATA
  const del = body.deletes || [];
  if (del.length) {
    const daAnnullare = new Set(del.map(String));
    const n = sh.getLastRow() - 1;
    if (n > 0) {
      const col = sh.getRange(2, 1, n, 1).getValues();
      for (let i = 0; i < n; i++) {
        if (daAnnullare.has(String(col[i][0]))) sh.getRange(i + 2, 9).setValue('ANNULLATA');
      }
    }
  }

  // Elenco prodotti aggiornato
  if (Array.isArray(body.products)) {
    const pr = foglio_(FOGLIO_PRODOTTI);
    pr.clearContents();
    const righe = [['Codice', 'Prodotto', 'Prezzo']].concat(body.products.map(function (p) {
      return [String(p.code), String(p.name), Number(p.price) || 0];
    }));
    pr.getRange(1, 1, righe.length, 3).setValues(righe);
  }
  return { ok: true, added: nuove.length, deleted: del.length };
}

function ripristina_(dev) {
  const sh = foglio_(FOGLIO_SCANSIONI);
  const out = { ok: true, scans: [], products: [] };
  const n = sh.getLastRow() - 1;
  if (n > 0) {
    sh.getRange(2, 1, n, INTESTAZIONI.length).getValues().forEach(function (r) {
      if (r[8] !== 'OK' || String(r[2]) !== dev) return;
      out.scans.push({ id: String(r[0]), t: new Date(r[1]).getTime(), dev: String(r[2]), code: String(r[3]),
                       type: String(r[5]), unit: Number(r[6]) || 0, src: String(r[7]) });
    });
  }
  const pr = foglio_(FOGLIO_PRODOTTI);
  const m = pr.getLastRow() - 1;
  if (m > 0) {
    out.products = pr.getRange(2, 1, m, 3).getValues().filter(function (r) { return r[0] !== ''; })
      .map(function (r) { return { code: String(r[0]), name: String(r[1]), price: Number(r[2]) || 0 }; });
  }
  return out;
}

function idPresenti_(sh) {
  const n = sh.getLastRow() - 1;
  if (n <= 0) return new Set();
  return new Set(sh.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]); }));
}

function foglio_(nome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(nome) || ss.insertSheet(nome);
}

function risposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
