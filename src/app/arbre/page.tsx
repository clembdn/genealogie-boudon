import { loadArbreData } from '@/lib/arbre-data';
import { ArbreCanvas } from '@/components/arbre/ArbreCanvas';

// Lecture du fichier sur disque a chaque requete (pilote, sans base de donnees).
export const dynamic = 'force-dynamic';

export default async function ArbrePage() {
  const data = await loadArbreData();
  return <ArbreCanvas data={data} />;
}
