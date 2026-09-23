/**
 * L'Agence de Scott — pont « Agenda Google » pour le dashboard admin.
 *
 * Ce script vit DANS ton compte Google. Il expose une petite API JSON sur ton
 * agenda, appelable par la page /admin du dashboard (lagencedescott.fr).
 * Google Agenda reste la source de vérité : tu continues à tout gérer depuis
 * ton téléphone, tes invitations, tes rappels, tes récurrences.
 *
 * ---------------------------------------------------------------------------
 * INSTALLATION (une seule fois, ~5 minutes)
 * ---------------------------------------------------------------------------
 *  1. https://script.google.com  →  Nouveau projet  →  coller ce fichier
 *     dans Code.gs (remplacer le contenu par défaut).
 *  2. Paramètres du projet (icône ⚙)  →  Propriétés du script  →  Ajouter :
 *        AGENDA_BRIDGE_CODE = <une longue chaîne aléatoire>
 *     Générer la chaîne dans un terminal :   openssl rand -hex 24
 *  3. Déployer  →  Nouveau déploiement  →  type « Application web »
 *        Exécuter en tant que :  moi (ton adresse)
 *        Qui a accès           :  Tout le monde
 *     →  Autoriser (Google affiche « application non vérifiée » : c'est ton
 *        propre script, tu cliques sur « Paramètres avancés » puis « Continuer »).
 *  4. Copier l'URL du déploiement (elle finit par /exec).
 *  5. Tester dans un navigateur :
 *        <URL>/exec?action=ping&code=<AGENDA_BRIDGE_CODE>
 *     La réponse doit être du JSON avec "ok": true.
 *
 * ---------------------------------------------------------------------------
 * SÉCURITÉ
 * ---------------------------------------------------------------------------
 *  - L'URL /exec + le code donnent LECTURE ET ÉCRITURE sur l'agenda. Ils ne
 *    doivent aller ni dans le dépôt git (nutala/lagence-de-scott est PUBLIC)
 *    ni dans le bundle du site : ils se rangent dans Supabase, table
 *    settings, lisible uniquement par un utilisateur connecté au dashboard.
 *  - Révoquer l'accès = supprimer le déploiement dans Apps Script (ou changer
 *    la propriété AGENDA_BRIDGE_CODE).
 *  - Toutes les actions passent en GET avec paramètres d'URL : c'est le seul
 *    mode d'appel qu'Apps Script accepte sans se faire bloquer par le CORS
 *    du navigateur (pas de requête de contrôle OPTIONS).
 *
 * ---------------------------------------------------------------------------
 * API
 * ---------------------------------------------------------------------------
 *  action=ping     &code=…                                  → état du pont
 *  action=list     &code=…&start=2026-09-01&end=2026-10-01   → événements
 *  action=create   &code=…&title=…&start=2026-09-24T14:00
 *                          [&end=2026-09-24T15:00][&location=…][&notes=…]
 *  action=update   &code=…&id=…&title=…&start=…[&end=…]
 *  action=delete   &code=…&id=…
 *
 *  Dates : « AAAA-MM-JJ » (journée entière) ou « AAAA-MM-JJTHH:MM » (horaire).
 *  Tous les horaires sont interprétés en Europe/Paris.
 */

var TZ = 'Europe/Paris';
var CODE_PROP = 'AGENDA_BRIDGE_CODE';

// ---------------------------------------------------------------------------

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (!codeOk_(p.code)) {
      return json_({ ok: false, error: 'code_invalide' });
    }
    switch (p.action) {
      case 'ping':   return json_(ping_());
      case 'list':   return json_({ ok: true, events: list_(p) });
      case 'create': return json_({ ok: true, event: create_(p) });
      case 'update': return json_({ ok: true, event: update_(p) });
      case 'delete': return json_({ ok: true, deleted: delete_(p) });
      default:       return json_({ ok: false, error: 'action_inconnue' });
    }
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function ping_() {
  var c = cal_();
  return {
    ok: true,
    pont: 'agenda-agence',
    agenda: c.getName(),
    fuseau: c.getTimeZone(),
    maintenant: new Date().toISOString(),
    version: 1
  };
}

function list_(p) {
  var from = p.start ? parseDate_(p.start) : new Date();
  var to = p.end ? parseDate_(p.end) : new Date(from.getTime() + 60 * 86400000);
  if (to <= from) throw new Error('plage_invalide');
  var max = Math.min(Number(p.max) || 300, 1000);

  var events = cal_().getEvents(from, to);
  var out = [];
  for (var i = 0; i < events.length && out.length < max; i++) {
    out.push(serialize_(events[i]));
  }
  out.sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
  return out;
}

function create_(p) {
  if (!p.title) throw new Error('title_manquant');
  var start = parseDate_(p.start || new Date().toISOString().slice(0, 10));
  var opts = {};
  if (p.location) opts.location = p.location;
  if (p.notes) opts.description = p.notes;

  var ev;
  if (p.start && p.start.indexOf('T') > -1) {
    var end = p.end ? parseDate_(p.end) : new Date(start.getTime() + 3600000);
    ev = cal_().createEvent(p.title, start, end, opts);
  } else {
    // Journée entière : la fin est exclusive côté Google (jour suivant).
    var lastDay = p.end ? parseDate_(p.end) : start;
    ev = cal_().createAllDayEvent(p.title, lastDay, opts);
  }
  return serialize_(ev);
}

function update_(p) {
  if (!p.id) throw new Error('id_manquant');
  var ev = cal_().getEventById(p.id);
  if (!ev) throw new Error('evenement_introuvable');
  if (p.title) ev.setTitle(p.title);
  if (p.location) ev.setLocation(p.location);
  if (p.notes) ev.setDescription(p.notes);
  if (p.start) {
    var start = parseDate_(p.start);
    var end = p.end ? parseDate_(p.end) : new Date(start.getTime() + 3600000);
    ev.setTime(start, end);
  }
  return serialize_(ev);
}

function delete_(p) {
  if (!p.id) throw new Error('id_manquant');
  var ev = cal_().getEventById(p.id);
  if (!ev) throw new Error('evenement_introuvable');
  var label = ev.getTitle();
  ev.deleteEvent();
  return label;
}

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

function codeOk_(given) {
  if (!given) return false;
  var expected = PropertiesService.getScriptProperties().getProperty(CODE_PROP);
  if (!expected) throw new Error('propriete_' + CODE_PROP + '_absente');
  // Comparaison à durée constante (évite une fuite par timing).
  if (given.length !== expected.length) return false;
  var diff = 0;
  for (var i = 0; i < given.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

function cal_() {
  return CalendarApp.getDefaultCalendar();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** « 2026-09-24 » ou « 2026-09-24T14:00 » (ou avec secondes) → Date locale Paris. */
function parseDate_(s) {
  var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) throw new Error('date_invalide:' + s);
  var h = m[4] ? Number(m[4]) : 0;
  var mi = m[5] ? Number(m[5]) : 0;
  var sec = m[6] ? Number(m[6]) : 0;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), h, mi, sec);
}

function serialize_(ev) {
  var allDay = ev.isAllDayEvent();
  var start = ev.getStartTime();
  var end = ev.getEndTime();
  return {
    id: ev.getId(),
    title: ev.getTitle(),
    start: allDay ? fmtDay_(start) : fmtTime_(start),
    end: allDay ? fmtDay_(new Date(end.getTime() - 86400000)) : fmtTime_(end),
    allDay: allDay,
    location: ev.getLocation() || '',
    notes: (ev.getDescription() || '').slice(0, 500),
    recurring: ev.isRecurringEvent()
  };
}

function pad_(n) { return (n < 10 ? '0' : '') + n; }

function fmtDay_(d) {
  return d.getFullYear() + '-' + pad_(d.getMonth() + 1) + '-' + pad_(d.getDate());
}

function fmtTime_(d) {
  return fmtDay_(d) + 'T' + pad_(d.getHours()) + ':' + pad_(d.getMinutes());
}
