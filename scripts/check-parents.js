const fs = require('fs');

const hurgon = JSON.parse(fs.readFileSync('data/extracted/boudon-hurgon.json', 'utf8'));

// Find relations pointing to boudon-hurgon-10 or boudon-hurgon-3/4/5/6/7/8/9
const toIds = ['boudon-hurgon-10', 'boudon-hurgon-3', 'boudon-hurgon-4'];
const relations = hurgon.relations.filter(r => toIds.includes(r.toId));

console.log('Relations to targeted people:');
relations.forEach(r => {
  const fromP = hurgon.persons.find(p => p.id === r.fromId);
  const toP = hurgon.persons.find(p => p.id === r.toId);
  console.log(`  - Parent: ${fromP ? fromP.prenoms + ' ' + fromP.nom : r.fromId} (${r.fromId}) -> Child: ${toP ? toP.prenoms + ' ' + toP.nom : r.toId} (${r.toId})`);
});
