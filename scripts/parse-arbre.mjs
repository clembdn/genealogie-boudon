// Parser pilote : extrait les personnes de la feuille "Arbre".
// Lit les rectangles du drawing, decode chaque boite en champs structures.
// Garde TOUJOURS le texte brut (raw) pour ne rien perdre.
// Produit data/arbre-persons.json + un resume console.
// Usage : node scripts/parse-arbre.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const SHEET_NAME = 'Arbre';

// ============ Lecteur ZIP ============
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
  const nameLen = buf.readUInt16LE(p + 28);
  const extraLen = buf.readUInt16LE(p + 30);
  const commentLen = buf.readUInt16LE(p + 32);
  const lhOffset = buf.readUInt32LE(p + 42);
  const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
  entries.set(name, { compressed: compSize, method, lhOffset });
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
  throw new Error('Methode ' + e.method);
}
function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

// ============ Localiser la feuille + son drawing ============
const wbXml = readEntry('xl/workbook.xml').toString('utf8');
const wbRelsXml = readEntry('xl/_rels/workbook.xml.rels').toString('utf8');
const wbRelMap = new Map();
for (const m of wbRelsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
  const id = m[1].match(/\bId="([^"]+)"/)?.[1];
  const tgt = m[1].match(/\bTarget="([^"]+)"/)?.[1];
  if (id && tgt) wbRelMap.set(id, tgt);
}
let sheetPath = null;
for (const m of wbXml.matchAll(/<sheet\s+name="([^"]+)"\s+sheetId="\d+"\s+r:id="([^"]+)"/g)) {
  if (m[1] === SHEET_NAME) {
    const t = wbRelMap.get(m[2]);
    sheetPath = t.startsWith('/') ? t.slice(1) : 'xl/' + t;
  }
}
if (!sheetPath) throw new Error(`Feuille "${SHEET_NAME}" introuvable`);

function findDrawing(sheetPath) {
  const parts = sheetPath.split('/');
  const file = parts.pop();
  const relsXml = readEntry(parts.join('/') + '/_rels/' + file + '.rels')?.toString('utf8');
  if (!relsXml) return null;
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const type = m[1].match(/\bType="([^"]+)"/)?.[1] || '';
    const tgt = m[1].match(/\bTarget="([^"]+)"/)?.[1];
    if (type.includes('drawing') && tgt) {
      let t = tgt;
      if (t.startsWith('../')) t = t.slice(3);
      if (t.startsWith('/')) t = t.slice(1);
      if (!t.startsWith('xl/')) t = 'xl/' + t;
      return t;
    }
  }
  return null;
}
const drawingPath = findDrawing(sheetPath);
if (!drawingPath) throw new Error('Drawing introuvable pour ' + SHEET_NAME);

// ============ Parser le drawing -> shapes ============
function parseDrawing(xml) {
  const shapes = [];
  const anchorRe = /<(?:\w+:)?(twoCellAnchor|oneCellAnchor)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?\1>/g;
  for (const am of xml.matchAll(anchorRe)) {
    const inner = am[2];
    const fromXml = inner.match(/<(?:\w+:)?from>([\s\S]*?)<\/(?:\w+:)?from>/)?.[1];
    const col = fromXml?.match(/<(?:\w+:)?col>(\d+)<\/(?:\w+:)?col>/)?.[1];
    const row = fromXml?.match(/<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/)?.[1];
    const nameM = inner.match(/<(?:\w+:)?cNvPr\s+[^>]*name="([^"]+)"/);
    const txBody = inner.match(/<(?:\w+:)?txBody>([\s\S]*?)<\/(?:\w+:)?txBody>/)?.[1];
    const paragraphs = [];
    if (txBody) {
      for (const pm of txBody.matchAll(/<(?:\w+:)?p\b[^>]*>([\s\S]*?)<\/(?:\w+:)?p>/g)) {
        const runs = [];
        for (const tm of pm[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)) {
          runs.push(decodeXml(tm[1]));
        }
        const para = runs.join('').replace(/\s+/g, ' ').trim();
        if (para) paragraphs.push(para);
      }
    }
    shapes.push({
      shapeName: nameM ? nameM[1] : null,
      row: row != null ? +row : null,
      col: col != null ? +col : null,
      paragraphs,
    });
  }
  return shapes;
}
const shapes = parseDrawing(readEntry(drawingPath).toString('utf8'));

// ============ Classification + extraction ============
const RE_GEN = /g[ée]n[ée]ration/i;
const RE_YEAR = /\b(1[5-9]\d{2}|20\d{2})\b/;
// Un mot "patronyme" : majuscules, accents inclus
const UPPER = "A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ";
const RE_SURNAME_WORD = new RegExp(`^[${UPPER}][${UPPER}'’\\-]+$`);
const RE_NAME_LINE = new RegExp(`^[${UPPER}][${UPPER}'’\\-]+(?:\\s+[${UPPER}][${UPPER}'’\\-]+)*\\s+\\S`);

function splitName(s) {
  let surnom = null;
  const nm = s.match(/[«"“]([^»"”]+)[»"”]/);
  if (nm) {
    surnom = nm[1].trim();
    s = s.replace(nm[0], ' ').replace(/\s+/g, ' ').trim();
  }
  const tokens = s.split(/\s+/);
  const nomTokens = [];
  let i = 0;
  while (i < tokens.length && RE_SURNAME_WORD.test(tokens[i])) {
    nomTokens.push(tokens[i]);
    i++;
  }
  return {
    nom: nomTokens.join(' '),
    prenoms: tokens.slice(i).join(' '),
    surnom,
  };
}

function splitDateLieu(s) {
  s = s.replace(/^[°+]\s*/, '').trim();
  const slash = s.indexOf('/');
  if (slash >= 0) return { date: s.slice(0, slash).trim() || null, lieu: s.slice(slash + 1).trim() || null };
  return { date: s || null, lieu: null };
}

// Une boite multi-personnes : 2+ paragraphes qui ressemblent chacun a "NOM ... annee"
function isInlinePerson(seg) {
  return RE_NAME_LINE.test(seg) && RE_YEAR.test(seg);
}

function parseInlinePerson(seg) {
  const { nom, prenoms, surnom } = splitName(seg);
  // Annees presentes -> 1re = naissance approx, 2e = deces approx
  const years = [...seg.matchAll(/\b(1[5-9]\d{2}|20\d{2})\b/g)].map((m) => m[1]);
  return {
    raw: seg,
    nom,
    // prenoms peut contenir des annees/lieux : on coupe avant la 1re annee
    prenoms: prenoms.split(RE_YEAR)[0].trim() || prenoms,
    surnom,
    naissance: years[0] ? { date: years[0], lieu: null } : null,
    deces: years[1] ? { date: years[1], lieu: null } : null,
    parrain: null,
    marraine: null,
    notes: null,
  };
}

function parseSinglePerson(paragraphs) {
  const [first, ...rest] = paragraphs;
  const { nom, prenoms, surnom } = splitName(first);
  const person = {
    nom,
    prenoms,
    surnom,
    naissance: null,
    deces: null,
    parrain: null,
    marraine: null,
    notes: null,
  };
  const notes = [];
  for (const seg of rest) {
    if (/^°/.test(seg)) {
      person.naissance = splitDateLieu(seg);
    } else if (/^\+/.test(seg)) {
      person.deces = splitDateLieu(seg);
    } else if (/^[Pp]\s+[A-ZÀ-Ý]/.test(seg)) {
      person.parrain = seg.replace(/^[Pp]\s+/, '').trim();
    } else if (/^[Mm]\s+[A-ZÀ-Ý]/.test(seg)) {
      person.marraine = seg.replace(/^[Mm]\s+/, '').trim();
    } else {
      notes.push(seg);
    }
  }
  if (notes.length) person.notes = notes.join(' · ');
  // Repli : si aucune date trouvee, chercher des annees collees dans la ligne du nom
  if (!person.naissance && !person.deces) {
    const years = [...first.matchAll(/\b(1[5-9]\d{2}|20\d{2})\b/g)].map((m) => m[1]);
    if (years[0]) person.naissance = { date: years[0], lieu: null, approx: true };
    if (years[1]) person.deces = { date: years[1], lieu: null, approx: true };
  }
  return person;
}

// Une boite vide de sens : seulement tirets, points d'interrogation, espaces
function isJunk(p) {
  return /^[-–—?.\s]*$/.test(p);
}

const result = {
  sheet: SHEET_NAME,
  source: 'data/sample.xlsx',
  drawing: drawingPath,
  generations: [],
  persons: [],
  unions: [],
  branchPointers: [],
  annotations: [],
  skipped: [],
};

let pid = 0;
for (const sh of shapes) {
  const pos = { row: sh.row, col: sh.col, shapeName: sh.shapeName };
  // On ignore les paragraphes vides de sens (tirets, "?")
  const paras = sh.paragraphs.filter((p) => !isJunk(p));
  if (paras.length === 0) {
    // connecteur / image / shape vide / separateur -> ignore mais comptabilise
    result.skipped.push({ ...pos, reason: sh.paragraphs.length ? 'sans contenu utile' : 'sans texte' });
    continue;
  }
  const joined = paras.join(' | ');

  // Etiquette de generation
  if (paras.some((p) => RE_GEN.test(p))) {
    result.generations.push({ ...pos, label: joined });
    continue;
  }
  // Pointeur vers une autre feuille : "Arbre BOUDON HURGON ...", "Voir arbre ..."
  if (/^(Arbre|Voir\s+arbre)\b/i.test(paras[0])) {
    result.branchPointers.push({ ...pos, text: joined });
    continue;
  }
  // Boite d'union : "BOUDON / VEYLET ..." sans date de naissance/deces,
  // ou boite de mariage commencant par un marqueur "X" / "2x"
  const isUnionPair = /^[A-ZÀ-Ý][\wÀ-ÿ'’\-]*\s*\/\s*[A-ZÀ-Ý]/.test(paras[0]) &&
    !paras.some((p) => /^[°+]/.test(p));
  const isMarriageBox = /^2?[Xx]\s/.test(paras[0]);
  if (isUnionPair || isMarriageBox) {
    result.unions.push({ ...pos, text: joined });
    continue;
  }
  // Multi-personnes : 2+ paragraphes "NOM ... annee"
  const inlineCount = paras.filter(isInlinePerson).length;
  if (inlineCount >= 2 && inlineCount >= paras.length - 1) {
    for (const seg of paras) {
      if (!isInlinePerson(seg)) continue;
      result.persons.push({
        id: `arbre-${++pid}`,
        ...pos,
        multiPerson: true,
        ...parseInlinePerson(seg),
      });
    }
    continue;
  }
  // Personne unique
  const parsed = parseSinglePerson(paras);
  // Si ni nom ni date : ce n'est pas une personne -> annotation libre
  if (!parsed.nom && !parsed.naissance && !parsed.deces) {
    result.annotations.push({ ...pos, text: joined });
    continue;
  }
  result.persons.push({
    id: `arbre-${++pid}`,
    ...pos,
    multiPerson: false,
    raw: joined,
    ...parsed,
  });
}

// Tri des personnes par position (haut->bas, gauche->droite)
result.persons.sort((a, b) => (a.row - b.row) || (a.col - b.col));

writeFileSync(resolve('data/arbre-persons.json'), JSON.stringify(result, null, 2));

// ============ Resume console ============
console.log(`Feuille     : ${SHEET_NAME}`);
console.log(`Drawing     : ${drawingPath}`);
console.log(`Shapes      : ${shapes.length}`);
console.log(`Personnes   : ${result.persons.length} (dont ${result.persons.filter((p) => p.multiPerson).length} issues de boites multi-personnes)`);
console.log(`Unions      : ${result.unions.length}`);
console.log(`Pointeurs   : ${result.branchPointers.length}`);
console.log(`Annotations : ${result.annotations.length}`);
console.log(`Generations : ${result.generations.length}`);
console.log(`Ignores     : ${result.skipped.length} (connecteurs/images/vides)`);
const sansNom = result.persons.filter((p) => !p.nom);
const sansDates = result.persons.filter((p) => !p.naissance && !p.deces);
console.log(`\nControle qualite :`);
console.log(`  Personnes sans nom detecte : ${sansNom.length}`);
console.log(`  Personnes sans aucune date : ${sansDates.length}`);
console.log(`\nEchantillon (8 premieres personnes) :`);
for (const p of result.persons.slice(0, 8)) {
  const n = `${p.nom} ${p.prenoms}`.trim();
  const naiss = p.naissance ? `°${p.naissance.date || '?'}` : '';
  const dec = p.deces ? `+${p.deces.date || '?'}` : '';
  console.log(`  [R${p.row}C${p.col}] ${n} ${naiss} ${dec}`);
}
console.log(`\nDetail complet : data/arbre-persons.json`);
