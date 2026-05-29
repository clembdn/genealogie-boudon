const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('data/extracted/_summary.json', 'utf8'));
const sheets = summary.sheets;

console.log('Searching for ID references in other sheets:');
const arbreIds = new Set(
  JSON.parse(fs.readFileSync('data/extracted/arbre.json', 'utf8')).persons.map(p => p.id)
);

for (const sheet of sheets) {
  if (sheet.slug === 'arbre') continue;
  const data = JSON.parse(fs.readFileSync(`data/extracted/${sheet.slug}.json`, 'utf8'));
  
  const personsReferencingArbre = data.persons.filter(p => p.id.startsWith('arbre-'));
  const relationsReferencingArbre = data.relations.filter(
    r => r.fromId.startsWith('arbre-') || r.toId.startsWith('arbre-')
  );
  
  console.log(`- Sheet "${sheet.name}" (${sheet.slug}):`);
  console.log(`  * Persons with ID starting with "arbre-": ${personsReferencingArbre.length}`);
  console.log(`  * Relations referencing "arbre-" IDs: ${relationsReferencingArbre.length}`);
  
  if (relationsReferencingArbre.length > 0) {
    console.log('    Relations:');
    relationsReferencingArbre.forEach(r => {
      console.log(`      ${r.fromId} -> ${r.toId} (${r.type})`);
    });
  }
}
