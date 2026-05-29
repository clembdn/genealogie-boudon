const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('data/extracted/_summary.json', 'utf8'));
const sheets = summary.sheets;

const otherIds = new Set();
for (const sheet of sheets) {
  if (sheet.slug === 'arbre') continue;
  const data = JSON.parse(fs.readFileSync(`data/extracted/${sheet.slug}.json`, 'utf8'));
  for (const p of data.persons) {
    otherIds.add(p.id);
  }
}

console.log(`Total other sheets IDs: ${otherIds.size}`);

const arbreData = JSON.parse(fs.readFileSync('data/extracted/arbre.json', 'utf8'));
const personsFromOther = arbreData.persons.filter(p => otherIds.has(p.id));
const relationsToOther = arbreData.relations.filter(r => otherIds.has(r.fromId) || otherIds.has(r.toId));

console.log(`Arbre sheet persons present in other sheets: ${personsFromOther.length}`);
console.log(`Arbre sheet relations referencing other sheets: ${relationsToOther.length}`);

if (relationsToOther.length > 0) {
  console.log('Relations in Arbre referencing other sheets:');
  relationsToOther.forEach(r => {
    console.log(`  ${r.fromId} -> ${r.toId} (${r.type})`);
  });
}
