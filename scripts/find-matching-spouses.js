const fs = require('fs');

const summary = JSON.parse(fs.readFileSync('data/extracted/_summary.json', 'utf8'));
const sheets = summary.sheets;

const arbreData = JSON.parse(fs.readFileSync('data/extracted/arbre.json', 'utf8'));
const arbrePersons = arbreData.persons;

console.log('Matching spouses between Arbre and other sheets:');

for (const sheet of sheets) {
  if (sheet.slug === 'arbre') continue;
  const data = JSON.parse(fs.readFileSync(`data/extracted/${sheet.slug}.json`, 'utf8'));
  const sheetPersons = data.persons;
  
  console.log(`\n=== sheet: ${sheet.name} (${sheet.slug}) ===`);
  
  // Find persons in Arbre whose name/prenoms matches someone in this sheet,
  // or whose raw text contains the family name.
  const matches = [];
  
  for (const ap of arbrePersons) {
    for (const sp of sheetPersons) {
      // Direct name match (case insensitive)
      const nomMatch = ap.nom && sp.nom && ap.nom.toLowerCase().trim() === sp.nom.toLowerCase().trim();
      const prenomMatch = ap.prenoms && sp.prenoms && ap.prenoms.toLowerCase().trim() === sp.prenoms.toLowerCase().trim();
      
      // Also match if they have the same birth/death dates
      const birthMatch = ap.naissance && sp.naissance && ap.naissance.date && sp.naissance.date && ap.naissance.date === sp.naissance.date;
      
      if (nomMatch && (prenomMatch || birthMatch)) {
        matches.push({ arbre: ap, external: sp, reason: `Name/Prenoms match (${ap.prenoms} ${ap.nom})` });
      }
    }
  }
  
  console.log(`Found ${matches.length} matches:`);
  matches.forEach(m => {
    console.log(`  - Arbre person: ${m.arbre.prenoms} ${m.arbre.nom} (ID: ${m.arbre.id}, raw: "${m.arbre.raw}")`);
    console.log(`    External person: ${m.external.prenoms} ${m.external.nom} (ID: ${m.external.id}, raw: "${m.external.raw}")`);
  });
}
