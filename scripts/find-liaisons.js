const fs = require('fs');
const path = require('path');

const summary = JSON.parse(fs.readFileSync('data/extracted/_summary.json', 'utf8'));
const sheets = summary.sheets;

const personsBySheet = {};
const unionsBySheet = {};

// Load all persons and unions
for (const sheet of sheets) {
  const data = JSON.parse(fs.readFileSync(`data/extracted/${sheet.slug}.json`, 'utf8'));
  personsBySheet[sheet.slug] = data.persons;
  
  // Reconstruct unions
  const parentsByChild = {};
  for (const rel of data.relations) {
    if (rel.type === 'parent-child') {
      if (!parentsByChild[rel.toId]) parentsByChild[rel.toId] = new Set();
      parentsByChild[rel.toId].add(rel.fromId);
    }
  }
  
  const unions = [];
  for (const childId in parentsByChild) {
    const parents = Array.from(parentsByChild[childId]);
    if (parents.length === 2) {
      parents.sort();
      const key = parents.join('|');
      if (!unions.some(u => u.key === key)) {
        unions.push({ key, partner1: parents[0], partner2: parents[1] });
      }
    } else if (parents.length === 1) {
      const key = `solo:${parents[0]}`;
      if (!unions.some(u => u.key === key)) {
        unions.push({ key, partner1: parents[0], partner2: null });
      }
    }
  }
  unionsBySheet[sheet.slug] = unions;
}

console.log('TRACE OF LIAISONS:');
// Now let's see: for each sheet other than 'arbre', let's check if there are any unions where
// one partner is in this sheet, and the other partner is in 'arbre'.
const personToSheet = {};
for (const slug in personsBySheet) {
  for (const p of personsBySheet[slug]) {
    personToSheet[p.id] = slug;
  }
}

const allUnions = [];
for (const slug in unionsBySheet) {
  for (const u of unionsBySheet[slug]) {
    allUnions.push({ ...u, sheet: slug });
  }
}

const crossSheetUnions = [];
for (const u of allUnions) {
  if (u.partner1 && u.partner2) {
    const s1 = personToSheet[u.partner1];
    const s2 = personToSheet[u.partner2];
    if (s1 && s2 && s1 !== s2) {
      crossSheetUnions.push({
        unionKey: u.key,
        partner1: u.partner1,
        partner1Sheet: s1,
        partner2: u.partner2,
        partner2Sheet: s2,
      });
    }
  }
}

console.log(`Found ${crossSheetUnions.length} cross-sheet unions:`);
for (const c of crossSheetUnions) {
  console.log(`- Union between ${c.partner1} (${c.partner1Sheet}) and ${c.partner2} (${c.partner2Sheet})`);
}

// Let's check for each of the 8 other sheets if they are connected to 'arbre' (either directly or via a chain)
const adj = {};
const sheetsList = sheets.map(s => s.slug);
for (const s of sheetsList) adj[s] = new Set();

for (const c of crossSheetUnions) {
  adj[c.partner1Sheet].add(c.partner2Sheet);
  adj[c.partner2Sheet].add(c.partner1Sheet);
}

console.log('\nAdjacency list of families connection:');
for (const s in adj) {
  console.log(`- ${s} connects to: ${Array.from(adj[s]).join(', ')}`);
}
