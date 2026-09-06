import logoUrl from '../assets/images/logo_cropped.png';
import type { Client, DevisLigne, Settings } from './types';
import { formatEUR, formatDate, splitDetails } from './types';

function escapeHtml(s: string | null | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface InvoiceDoc {
  type: 'devis' | 'facture';
  numero: string;
  titre: string | null;
  date: string;
  statut: string;
  date2Label: string;
  date2Text: string | null;
  client: Client | null;
  rows: DevisLigne[];
  tva: number;
  notes: string | null;
  settings: Settings | null;
}

export function buildInvoiceHtml(doc: InvoiceDoc): string {
  const { type, numero, titre, date, statut, date2Label, date2Text, client, rows, tva, notes, settings } = doc;
  const ht = rows.reduce((s, l) => s + ((l as unknown as { inclus?: boolean }).inclus ? 0 : Number(l.quantite) * Number(l.prix_unitaire)), 0);
  const tvaVal = Number(tva || 0);
  const ttc = ht * (1 + tvaVal / 100);
  const agence = settings?.agence_nom || "L'Agence de Scott";
  const absLogo = typeof window !== 'undefined' ? window.location.origin + logoUrl : logoUrl;

  const isInclus = (l: DevisLigne) => (l as unknown as { inclus?: boolean }).inclus === true;
  const rowsHtml = rows
    .map(
      (l) => {
        const inclus = isInclus(l);
        const details = splitDetails((l as unknown as { details?: string | null }).details);
        const pu = inclus ? `<span style="color:#6b7280;font-style:italic">Inclus</span>` : escapeHtml(formatEUR(l.prix_unitaire));
        const tot = inclus ? `<span style="color:#6b7280;font-style:italic">Inclus</span>` : `<strong>${escapeHtml(formatEUR(Number(l.quantite) * Number(l.prix_unitaire)))}</strong>`;
        const detailsHtml = details.length
          ? `<ul style="margin:6px 0 0;padding-left:18px;color:#4b5563;font-size:12.5px;line-height:1.55">${details.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
          : '';
        return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb"><div style="font-weight:600">${escapeHtml(l.description)}</div>${detailsHtml}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${Number(l.quantite)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${pu}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${tot}</td>
      </tr>`;
      },
    )
    .join('');

  const clientHtml = client
    ? `<div style="font-size:14px;font-weight:600">${escapeHtml(client.nom)}${client.entreprise ? ` · ${escapeHtml(client.entreprise)}` : ''}</div>
      ${client.adresse ? `<div class="muted" style="font-size:13px;margin-top:2px">${escapeHtml(client.adresse)}</div>` : ''}
      ${client.email ? `<div class="muted">${escapeHtml(client.email)}</div>` : ''}
      ${client.telephone ? `<div class="muted">${escapeHtml(client.telephone)}</div>` : ''}`
    : '<div style="font-size:14px;font-weight:600">Client supprimé</div>';

  const ibanHtml =
    type === 'facture' && settings?.iban
      ? `<div class="totals" style="border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-top:28px">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin-bottom:8px">Paiement</div>
        <div style="font-size:14px">IBAN : <strong>${escapeHtml(settings.iban)}</strong></div>
        ${settings.bic ? `<div style="font-size:14px">BIC : ${escapeHtml(settings.bic)}</div>` : ''}
        <div class="muted" style="font-size:12px">Merci d'effectuer le règlement à réception de cette facture.</div>
      </div>`
      : '';

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${type === 'devis' ? 'Devis' : 'Facture'} ${escapeHtml(numero)}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:48px}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ca6e0d;padding-bottom:24px;margin-bottom:32px}
    .logo{height:64px;object-fit:contain;margin-bottom:12px}
    h1{font-size:26px;margin:0 0 4px}.muted{color:#6b7280;font-size:13px;margin:2px 0}
    .box{font-size:13px;margin-bottom:24px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:0 0 8px}
    table{width:100%;border-collapse:collapse;margin-top:8px}th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;padding:8px 12px;border-bottom:2px solid #e5e7eb}
    .totals{margin-left:auto;width:280px;margin-top:24px}.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
    .totals .grand{font-weight:700;font-size:18px;border-top:2px solid #ca6e0d;margin-top:6px;padding-top:10px;color:#ca6e0d}
    .notes{margin-top:24px;font-size:13px;color:#6b7280}.foot{margin-top:48px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af}
    @media print{body{padding:24px}.logo{height:52px}}
  </style></head><body>
    <div class="head">
      <div>
        <img src="${absLogo}" class="logo" alt="Logo">
        <h1>${type === 'devis' ? 'DEVIS' : 'FACTURE'} ${escapeHtml(numero)}</h1>
        <div style="font-size:17px;font-weight:700;margin:2px 0">${escapeHtml(agence)}</div>
        ${settings?.adresse ? `<div class="muted">${escapeHtml(settings.adresse)}</div>` : ''}
        <div class="muted">${escapeHtml(settings?.email ?? '')}${settings?.telephone ? ` · ${escapeHtml(settings.telephone)}` : ''}</div>
        ${settings?.siret ? `<div class="muted">SIRET : ${escapeHtml(settings.siret)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div class="muted">Date : ${formatDate(date)}</div>
        <div class="muted">${escapeHtml(date2Label)} : ${escapeHtml(date2Text ?? '—')}</div>
        <div class="muted">Statut : ${escapeHtml(statut)}</div>
      </div>
    </div>
    <div style="display:flex;gap:48px">
      <div class="box"><h3>Émis pour</h3>${clientHtml}</div>
      ${titre ? `<div class="box"><h3>Objet</h3><div style="font-size:14px">${escapeHtml(titre)}</div></div>` : ''}
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix unitaire</th><th style="text-align:right">Total</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    <div class="totals">
      <div><span>Total HT</span><span>${formatEUR(ht)}</span></div>
      <div><span>TVA (${tvaVal}%)</span><span>${formatEUR(ht * tvaVal / 100)}</span></div>
      <div class="grand"><span>Total TTC</span><span>${formatEUR(ttc)}</span></div>
    </div>
    ${ibanHtml}
    ${notes ? `<div class="notes"><strong>Notes :</strong><br>${escapeHtml(notes).replace(/\n/g, '<br>')}</div>` : ''}
    <div style="margin-top:32px;text-align:center;font-size:11px;color:#6b7280;font-style:italic">TVA non applicable, art. 293 B du CGI</div>
    <div class="foot">${escapeHtml(agence)} — Document généré le ${new Date().toLocaleDateString('fr-FR')}.</div>
  </body></html>`;
}

export function printInvoice(doc: InvoiceDoc) {
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    window.alert('Veuillez autoriser les fenêtres pop-up pour exporter le PDF.');
    return;
  }
  win.document.write(buildInvoiceHtml(doc));
  win.document.close();
  win.focus();
  const images = Array.from(win.document.images);
  const wait = images.length
    ? Promise.all(
        images.map((img) =>
          img.complete ? Promise.resolve() : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          }),
        ),
      )
    : Promise.resolve();
  wait.then(() => setTimeout(() => win.print(), 250));
}
