const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/extracted/boudon-hurgon.json', 'utf8'));

const children = new Set();
for (const rel of data.relations) {
  if (rel.type === 'parent-child') {
    children.add(rel.toId);
  }
}

const roots = data.persons.filter(p => !children.has(p.id));
console.log(`Found ${roots.length} roots:`);
roots.sort((a, b) => a.row - b.row || a.col - b.col);
for (const r of roots.slice(0, 15)) {
  console.log(`  - ${r.prenoms} ${r.nom} (ID: ${r.id}) at row=${r.row}, col=${r.col} (raw="${r.raw}")`);
}
