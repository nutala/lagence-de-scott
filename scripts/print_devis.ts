/**
 * Rendu HTML d'un devis / facture hors navigateur.
 *
 * Réutilise le buildInvoiceHtml() de l'admin (src/admin/pdf.ts) : le PDF produit
 * ici est donc strictement celui du bouton « PDF », sans passer par l'interface.
 *
 * Le PNG du logo est inliné en data-URI par esbuild (--loader:.png=dataurl),
 * sinon l'import ne se résout pas hors Vite.
 *
 *   npx esbuild scripts/print_devis.ts --bundle --platform=node --format=esm \
 *     --loader:.png=dataurl --outfile=/tmp/print_devis.mjs
 *   node /tmp/print_devis.mjs doc.json > devis.html
 */
import { readFileSync } from 'node:fs';
import { buildInvoiceHtml, type InvoiceDoc } from '../src/admin/pdf';

const file = process.argv[2];
if (!file) {
  console.error('usage: node print_devis.mjs <doc.json>');
  process.exit(2);
}
const doc = JSON.parse(readFileSync(file, 'utf8')) as InvoiceDoc;
process.stdout.write(buildInvoiceHtml(doc));
