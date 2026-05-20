// Extrait le texte de TOUTES les shapes/rectangles des drawings.
// C'est la qu'on trouvera les noms des personnes.
// Usage : node scripts/dump-drawings.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

// --- ZIP reader ---
const buf = readFileSync(resolve('data/sample.xlsx'));
function findEOCD(b) {
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('EOCD introuvable');
}
const eocd = findEOCD(buf);
const cdEntries = buf.readUInt16LE(eocd + 10);
const cdOffset = buf.readUInt32LE(eocd + 16);
const entries = new Map();
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
  if (!e) return null;
  const lh = e.lhOffset;
  const nLen = buf.readUInt16LE(lh + 26);
  const xLen = buf.readUInt16LE(lh + 28);
  const data = buf.slice(lh + 30 + nLen + xLen, lh + 30 + nLen + xLen + e.compressed);
  if (e.method === 0) return data;
  if (e.method === 8) return inflateRawSync(data);
  throw new Error('Methode non supportee');
}
function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

// --- Map sheet -> drawing ---
const wbXml = readEntry('xl/workbook.xml').toString('utf8');
const wbRelsXml = readEntry('xl/_rels/workbook.xml.rels').toString('utf8');
const wbRelMap = new Map();
for (const m of wbRelsXml.matchAll(/<Relationship\s+[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
  wbRelMap.set(m[1], m[2]);
}
const sheetList = [];
for (const m of wbXml.matchAll(/<sheet\s+name="([^"]+)"\s+sheetId="(\d+)"\s+r:id="([^"]+)"/g)) {
  const target = wbRelMap.get(m[3]);
  const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
  sheetList.push({ name: m[1], path });
}

// Pour chaque feuille, trouver le drawing.xml associe via _rels/sheetN.xml.rels
function findDrawingForSheet(sheetPath) {
  // sheetPath = "xl/worksheets/sheet1.xml" -> "xl/worksheets/_rels/sheet1.xml.rels"
  const parts = sheetPath.split('/');
  const file = parts.pop();
  const relsPath = parts.join('/') + '/_rels/' + file + '.rels';
  const data = readEntry(relsPath);
  if (!data) return null;
  const relsXml = data.toString('utf8');
  // Parse chaque <Relationship .../> independamment de l'ordre des attributs
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    const typeM = attrs.match(/\bType="([^"]+)"/);
    const targetM = attrs.match(/\bTarget="([^"]+)"/);
    if (!typeM || !targetM) continue;
    if (!typeM[1].includes('drawing')) continue;
    // Resoudre le chemin relatif "../drawings/drawing1.xml" -> "xl/drawings/drawing1.xml"
    let target = targetM[1];
    if (target.startsWith('../')) target = target.slice(3);
    if (target.startsWith('/')) target = target.slice(1);
    if (!target.startsWith('xl/')) target = 'xl/' + target;
    return target;
  }
  return null;
}

// --- Parser d'un drawing XML ---
// Tolerant aux prefixes (xdr:/a:/etc.) en matchant le local-name
function parseDrawing(xml) {
  const shapes = [];
  // On capture les twoCellAnchor et oneCellAnchor (les shapes ancrees sur 2 ou 1 cellules)
  const anchorRegex = /<(?:\w+:)?(twoCellAnchor|oneCellAnchor)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?\1>/g;
  for (const am of xml.matchAll(anchorRegex)) {
    const inner = am[2];

    // Position from/to : <xdr:col>N</xdr:col><xdr:row>M</xdr:row>
    const from = extractPos(inner.match(/<(?:\w+:)?from>([\s\S]*?)<\/(?:\w+:)?from>/)?.[1]);
    const to = extractPos(inner.match(/<(?:\w+:)?to>([\s\S]*?)<\/(?:\w+:)?to>/)?.[1]);

    // Nom de la shape : <xdr:cNvPr id="123" name="Rectangle 957_2"/>
    const nameM = inner.match(/<(?:\w+:)?cNvPr\s+[^>]*name="([^"]+)"/);
    const shapeName = nameM ? nameM[1] : null;

    // Texte : tout le contenu des <a:t>...</a:t> dans <txBody>
    const txBody = inner.match(/<(?:\w+:)?txBody>([\s\S]*?)<\/(?:\w+:)?txBody>/)?.[1];
    let text = null;
    if (txBody) {
      const paragraphs = [];
      // Chaque <a:p> = un paragraphe (saut de ligne)
      for (const pm of txBody.matchAll(/<(?:\w+:)?p\b[^>]*>([\s\S]*?)<\/(?:\w+:)?p>/g)) {
        const runs = [];
        for (const tm of pm[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)) {
          runs.push(decodeXml(tm[1]));
        }
        paragraphs.push(runs.join(''));
      }
      text = paragraphs.join(' | ').trim();
    }

    if (text || shapeName) {
      shapes.push({ shapeName, from, to, text });
    }
  }
  return shapes;
}

function extractPos(xml) {
  if (!xml) return null;
  const col = xml.match(/<(?:\w+:)?col>(\d+)<\/(?:\w+:)?col>/)?.[1];
  const row = xml.match(/<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/)?.[1];
  return { col: col != null ? +col : null, row: row != null ? +row : null };
}

// --- Build & write ---
const lines = [];
let totalShapes = 0;
let totalWithText = 0;

for (const sheet of sheetList) {
  const drawingPath = findDrawingForSheet(sheet.path);
  lines.push(`\n========== ${sheet.name} ==========`);
  if (!drawingPath) {
    lines.push('  (aucun drawing associe)');
    continue;
  }
  const drawingData = readEntry(drawingPath);
  if (!drawingData) {
    lines.push(`  (drawing ${drawingPath} introuvable)`);
    continue;
  }
  const xml = drawingData.toString('utf8');
  const shapes = parseDrawing(xml);

  lines.push(`  Drawing : ${drawingPath}`);
  lines.push(`  ${shapes.length} shapes detectees, ${shapes.filter((s) => s.text).length} avec texte`);
  totalShapes += shapes.length;
  totalWithText += shapes.filter((s) => s.text).length;

  // Trie par position (row puis col)
  shapes.sort((a, b) => {
    const ra = a.from?.row ?? 9999, rb = b.from?.row ?? 9999;
    if (ra !== rb) return ra - rb;
    return (a.from?.col ?? 0) - (b.from?.col ?? 0);
  });

  for (const s of shapes) {
    const pos = s.from
      ? `R${s.from.row + 1}C${s.from.col + 1}${s.to ? `->R${s.to.row + 1}C${s.to.col + 1}` : ''}`
      : '?';
    const name = s.shapeName || '(sans nom)';
    const txt = s.text ? s.text.replace(/\s+/g, ' ').slice(0, 200) : '(vide)';
    lines.push(`    [${pos}] ${name} : ${txt}`);
  }
}

const summary = `\n=== TOTAL : ${totalShapes} shapes, ${totalWithText} avec texte ===\n`;
console.log(summary);
console.log(`Voir details dans data/drawings-dump.txt`);

writeFileSync(resolve('data/drawings-dump.txt'), summary + lines.join('\n'));
