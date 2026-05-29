const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/extracted/arbre.json', 'utf8'));
const persons = data.persons;
const pointers = data.pointers;

console.log('Pointers in Arbre:');
for (const ptr of pointers) {
  console.log(`\nPointer: "${ptr.text}" at row=${ptr.row}, col=${ptr.col}`);
  
  // Find persons nearby
  const nearby = persons.map(p => {
    const dist = Math.abs(p.row - ptr.row) + Math.abs(p.col - ptr.col);
    return { person: p, dist };
  });
  
  nearby.sort((a, b) => a.dist - b.dist);
  
  console.log('Closest persons:');
  for (let i = 0; i < Math.min(3, nearby.length); i++) {
    const { person, dist } = nearby[i];
    console.log(`  - ${person.prenoms} ${person.nom} (ID: ${person.id}) at row=${person.row}, col=${person.col} (dist=${dist}, raw="${person.raw}")`);
  }
}
