// Parser XLSX maison : lit directement les XML des feuilles, ignore les medias.
// Compatible avec le format OOXML "strict" (que SheetJS gere mal).
// Usage : node scripts/inspect-sheets.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const FILE = resolve('data/sample.xlsx');
const OUT = resolve('data/sheets-report.json');

// ---------- Mini lecteur ZIP ----------
const buf = readFileSync(FILE);

function findEOCD(b) {
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('EOCD introuvable');
}

const eocd = findEOCD(buf);
const cdEntries = buf.readUInt16LE(eocd + 10);
const cdOffset = buf.readUInt32LE(eocd + 16);

const entries = new Map(); // name -> { compressed, uncompressed, method, lhOffset }
let p = cdOffset;
for (let i = 0; i < cdEntries; i++) {
  const method = buf.readUInt16LE(p + 10);
  const compSize = buf.readUInt32LE(p + 20);
  const realSize = buf.readUInt32LE(p + 24);
  const nameLen = buf.readUInt16LE(p + 28);
  const extraLen = buf.readUInt16LE(p + 30);
  const commentLen = buf.readUInt16LE(p + 32);
  const lhOffset = buf.readUInt32LE(p + 42);
  const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
  entries.set(name, { compressed: compSize, uncompressed: realSize, method, lhOffset });
  p += 46 + nameLen + extraLen + commentLen;
}

function readEntry(name) {
  const e = entries.get(name);
  if (!e) throw new Error('Entree introuvable : ' + name);
  const lh = e.lhOffset;
  const nLen = buf.readUInt16LE(lh + 26);
  const xLen = buf.readUInt16LE(lh + 28);
  const data = buf.slice(lh + 30 + nLen + xLen, lh + 30 + nLen + xLen + e.compressed);
  if (e.method === 0) return data;
  if (e.method === 8) return inflateRawSync(data);
  throw new Error('Methode compression non supportee : ' + e.method);
}

// ---------- Mapping sheetN.xml -> nom lisible ----------
const wbXml = readEntry('xl/workbook.xml').toString('utf8');
const wbRelsXml = readEntry('xl/_rels/workbook.xml.rels').toString('utf8');

// rels : <Relationship Id="rId1" Target="worksheets/sheet1.xml" ...>
const relMap = new Map();
for (const m of wbRelsXml.matchAll(/<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  relMap.set(m[1], m[2]);
}

// sheets : <sheet name="X" sheetId="1" r:id="rId1"/>
const sheetList = [];
for (const m of wbXml.matchAll(/<sheet\s+name="([^"]+)"\s+sheetId="(\d+)"\s+r:id="([^"]+)"/g)) {
  const target = relMap.get(m[3]);
  if (!target) continue;
  // Target peut etre "worksheets/sheet1.xml" -> on prefixe "xl/"
  const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
  sheetList.push({ name: m[1], sheetId: m[2], path });
}

// ---------- sharedStrings ----------
const sst = [];
if (entries.has('xl/sharedStrings.xml')) {
  const xml = readEntry('xl/sharedStrings.xml').toString('utf8');
  // Chaque <si> contient un ou plusieurs <t>, on concatene
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [];
    for (const t of si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) {
      parts.push(decodeXml(t[1]));
    }
    sst.push(parts.join(''));
  }
}

function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

// ---------- Parse une feuille en tableau 2D ----------
function colLetterToIdx(letters) {
  let n = 0;
  for (const c of letters) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function parseSheet(xml) {
  const rows = [];
  // <row r="N">...</row>
  for (const rowM of xml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const rowIdx = +rowM[1] - 1;
    const rowContent = rowM[2];
    const cells = [];
    // Match <c r="A1" ...> ... </c>  ET <c r="A1" .../>  (cellule vide auto-fermee)
    for (const cM of rowContent.matchAll(/<c\s+r="([A-Z]+)\d+"([^>\/]*)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const colIdx = colLetterToIdx(cM[1]);
      const attrs = cM[2] || '';
      const inner = cM[3] || '';
      // Extrait l'attribut t depuis attrs
      const tM = attrs.match(/\bt="([^"]+)"/);
      const type = tM ? tM[1] : 'n';
      let value = null;
      if (type === 's') {
        // shared string
        const vM = inner.match(/<v>(\d+)<\/v>/);
        if (vM) value = sst[+vM[1]];
      } else if (type === 'inlineStr') {
        const parts = [];
        for (const t of inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) parts.push(decodeXml(t[1]));
        value = parts.join('');
      } else if (type === 'str') {
        const vM = inner.match(/<v>([\s\S]*?)<\/v>/);
        if (vM) value = decodeXml(vM[1]);
      } else if (type === 'b') {
        const vM = inner.match(/<v>(\d)<\/v>/);
        if (vM) value = vM[1] === '1';
      } else {
        // nombre ou date (en mode strict, t="d" possible mais on garde brut)
        const vM = inner.match(/<v>([\s\S]*?)<\/v>/);
        if (vM) value = vM[1];
      }
      cells[colIdx] = value;
    }
    // Nettoyage : tableau dense
    const dense = [];
    const maxCol = cells.length;
    for (let i = 0; i < maxCol; i++) dense[i] = cells[i] ?? null;
    rows[rowIdx] = dense;
  }
  // Compacte les rows undefined en null
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}

// ---------- Construit le rapport ----------
const report = { sheets: [] };

for (const sh of sheetList) {
  const xml = readEntry(sh.path).toString('utf8');
  const rows = parseSheet(xml);

  // Trouve la derniere ligne non vide (Excel etend la "totalRows" par stylage seul)
  let lastNonEmpty = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some((c) => c != null && String(c).trim() !== '')) lastNonEmpty = i;
  }
  const totalRows = lastNonEmpty + 1;
  let maxCols = 0;
  for (let i = 0; i < totalRows; i++) if (rows[i].length > maxCols) maxCols = rows[i].length;

  // Heuristique en-tete : ligne la plus remplie parmi les 15 premieres
  let headerIdx = 0;
  let maxFilled = 0;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const filled = rows[i].filter((c) => c != null && String(c).trim() !== '').length;
    if (filled > maxFilled) {
      maxFilled = filled;
      headerIdx = i;
    }
  }
  const header = rows[headerIdx] || [];

  // Stats par colonne sur les donnees apres l'en-tete
  const colStats = [];
  for (let c = 0; c < Math.max(header.length, maxCols); c++) {
    let filled = 0;
    const samples = [];
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const v = rows[r][c];
      if (v != null && String(v).trim() !== '') {
        filled++;
        if (samples.length < 4) samples.push(String(v).slice(0, 100));
      }
    }
    colStats.push({
      col: c,
      name: header[c] != null ? String(header[c]).trim() : '',
      filledRatio: totalRows > headerIdx + 1 ? +(filled / (totalRows - headerIdx - 1)).toFixed(2) : 0,
      samples,
    });
  }

  // Premieres lignes brutes (ce qui est au-dessus de l'en-tete + 8 lignes apres)
  const preHeader = rows.slice(0, headerIdx);
  const dataPreview = rows.slice(headerIdx + 1, headerIdx + 9);

  report.sheets.push({
    name: sh.name,
    sheetId: sh.sheetId,
    path: sh.path,
    totalRows,
    maxCols,
    headerRowIndex: headerIdx,
    preHeader,
    header,
    dataPreview,
    colStats,
  });

  console.log(`- ${sh.name} : ${totalRows} lignes, ${maxCols} cols, header @ ligne ${headerIdx + 1}`);
}

writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(`\nRapport ecrit dans ${OUT}`);
