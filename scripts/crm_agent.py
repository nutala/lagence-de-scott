#!/usr/bin/env python3
"""Connecteur CRM de L'Agence de Scott — accès API au dashboard admin.

Le dashboard (src/admin, React) parle à Supabase avec la clé *anon* + une session
utilisateur. Ce module fait exactement la même chose depuis un script : il se
connecte avec le compte agent (Authentication > Users), obtient un JWT, et
interroge PostgREST. Les règles RLS restent appliquées — aucune clé service_role.

Identifiants : SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_AGENT_EMAIL /
SUPABASE_AGENT_PASSWORD, lus depuis la variable d'environnement si présente,
sinon depuis le fichier de secrets de Hermes.

Usage CLI (lecture seule) :
    python3 scripts/crm_agent.py check
    python3 scripts/crm_agent.py clients
    python3 scripts/crm_agent.py devis
    python3 scripts/crm_agent.py next-numero devis
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Iterable

SECRETS_FILES = [
    pathlib.Path(os.environ.get("HERMES_HOME", pathlib.Path.home() / ".hermes")) / ".env",
]


class CrmError(RuntimeError):
    """Erreur d'API remontée telle quelle (statut + corps) pour diagnostic."""

    def __init__(self, status: int, body: str):
        super().__init__(f"HTTP {status}: {body[:400]}")
        self.status = status
        self.body = body


def _load_env() -> dict[str, str]:
    """Variables d'environnement d'abord (cron), puis le fichier de secrets."""
    env = dict(os.environ)
    if not env.get("SUPABASE_AGENT_PASSWORD"):
        for path in SECRETS_FILES:
            if not path.exists():
                continue
            for line in path.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                env.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_AGENT_EMAIL",
                           "SUPABASE_AGENT_PASSWORD") if not env.get(k)]
    if missing:
        raise SystemExit("Variables manquantes : " + ", ".join(missing))
    return env


_ENV = _load_env()
_URL = _ENV["SUPABASE_URL"].rstrip("/")
_ANON = _ENV["SUPABASE_ANON_KEY"]
_TOKEN: str | None = None


def login(force: bool = False) -> str:
    """JWT du compte agent (mémorisé pour la durée du process)."""
    global _TOKEN
    if _TOKEN and not force:
        return _TOKEN
    status, body = _request(
        "POST", "/auth/v1/token?grant_type=password",
        {"email": _ENV["SUPABASE_AGENT_EMAIL"], "password": _ENV["SUPABASE_AGENT_PASSWORD"]},
        headers={"apikey": _ANON}, auth=False,
    )
    if status >= 300 or not isinstance(body, dict):
        raise CrmError(status, json.dumps(body) if not isinstance(body, str) else body)
    _TOKEN = body["access_token"]
    return _TOKEN


def _request(method: str, path: str, payload: Any = None, *, headers: dict | None = None,
             auth: bool = True, prefer: str | None = None) -> tuple[int, Any]:
    hdrs = {"apikey": _ANON}
    if auth:
        hdrs["Authorization"] = "Bearer " + login()
    if prefer:
        hdrs["Prefer"] = prefer
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        hdrs["Content-Type"] = "application/json"
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(_URL + path, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as exc:
        raise CrmError(exc.code, exc.read().decode()) from None


# ── Lecture ───────────────────────────────────────────────────────────────────

def select(table: str, query: str = "", columns: str = "*") -> list[dict]:
    q = urllib.parse.urlencode({"select": columns})
    path = f"/rest/v1/{table}?{q}" + (f"&{query}" if query else "")
    _, data = _request("GET", path)
    return data or []


def clients() -> list[dict]:
    return select("clients", "order=created_at.desc")


def devis() -> list[dict]:
    return select("devis", "order=date.desc")


def factures() -> list[dict]:
    return select("factures", "order=date.desc")


def devis_lignes(devis_id: str) -> list[dict]:
    return select("devis_lignes", f"devis_id=eq.{devis_id}&order=position.asc")


def settings() -> dict | None:
    rows = select("settings", "limit=1")
    return rows[0] if rows else None


# ── Écriture ──────────────────────────────────────────────────────────────────

def insert(table: str, row: dict) -> dict:
    """Insertion unitaire, renvoie la ligne créée (avec son id)."""
    _, data = _request("POST", f"/rest/v1/{table}", row, prefer="return=representation")
    return (data or [{}])[0]


def insert_many(table: str, rows: Iterable[dict]) -> list[dict]:
    rows = list(rows)
    if not rows:
        return []
    _, data = _request("POST", f"/rest/v1/{table}", rows, prefer="return=representation")
    return data or []


def delete(table: str, row_id: str) -> None:
    _request("DELETE", f"/rest/v1/{table}?id=eq.{row_id}")


def log(message: str) -> dict:
    """Journal lisible dans le dashboard (table activites)."""
    return insert("activites", {"message": message})


def next_numero(table: str, prefix: str, year: int | None = None) -> str:
    """Même règle que l'admin : <prefix><année>-NNN, séquence max + 1."""
    import datetime
    year = year or datetime.date.today().year
    p = f"{prefix}{year}-"
    seq = 0
    for row in select(table, "", columns="numero"):
        numero = row.get("numero") or ""
        if numero.startswith(p):
            tail = numero[len(p):]
            if tail.isdigit():
                seq = max(seq, int(tail))
    return f"{p}{seq + 1:03d}"


def find_client(nom: str | None = None, email: str | None = None) -> dict | None:
    if email:
        rows = select("clients", f"email=eq.{urllib.parse.quote(email)}")
        if rows:
            return rows[0]
    if nom:
        rows = select("clients", f"nom=ilike.{urllib.parse.quote(nom)}")
        if rows:
            return rows[0]
    return None


def create_client(*, nom: str, entreprise: str | None = None, email: str | None = None,
                  telephone: str | None = None, adresse: str | None = None,
                  notes: str | None = None) -> dict:
    client = insert("clients", {"nom": nom, "entreprise": entreprise, "email": email,
                                "telephone": telephone, "adresse": adresse, "notes": notes})
    log(f"Client créé : {nom}" + (f" ({entreprise})" if entreprise else "") + " — via agent")
    return client


def create_devis(*, client_id: str, titre: str, lignes: list[dict],
                 tva: float = 0, statut: str = "Brouillon", validite: str = "30 jours",
                 notes: str | None = None, date: str | None = None) -> dict:
    """Crée un devis + ses lignes. `lignes` : description, quantite, prix_unitaire,
    inclus (bool), details (str|None). Le numéro est calculé comme dans l'admin."""
    import datetime
    date = date or datetime.date.today().isoformat()
    numero = next_numero("devis", "D-")
    doc = insert("devis", {"numero": numero, "client_id": client_id, "titre": titre,
                           "date": date, "validite": validite, "statut": statut,
                           "tva": tva, "notes": notes})
    rows = [
        {"devis_id": doc["id"], "description": l["description"],
         "quantite": l.get("quantite", 1), "prix_unitaire": l.get("prix_unitaire", 0),
         "inclus": bool(l.get("inclus", False)), "details": l.get("details"),
         "position": i}
        for i, l in enumerate(lignes)
    ]
    insert_many("devis_lignes", rows)
    total = sum(0 if l.get("inclus") else float(l.get("quantite", 1)) * float(l.get("prix_unitaire", 0))
                for l in lignes)
    log(f"Devis {numero} créé ({titre}) — total HT {total:.2f} € — via agent")
    return doc


def build_doc(devis_id: str) -> dict:
    """Document prêt pour buildInvoiceHtml() (même forme que le bouton PDF de l'admin)."""
    doc = select("devis", f"id=eq.{devis_id}")[0]
    client = select("clients", f"id=eq.{doc['client_id']}")[0] if doc.get("client_id") else None
    st = settings() or {}
    agence = st.get("agence_nom") or "L'Agence de Scott"
    signataire = f"{agence} — {st['responsable']}" if st.get("responsable") else agence
    return {
        "type": "devis",
        "numero": doc["numero"],
        "titre": doc.get("titre"),
        "date": doc["date"],
        "statut": doc.get("statut"),
        "date2Label": "Validité",
        "date2Text": doc.get("validite"),
        "client": client,
        "rows": devis_lignes(devis_id),
        "tva": doc.get("tva", 0),
        "notes": doc.get("notes"),
        "settings": st,
        "signataireAgence": signataire,
    }


# ── CLI (lecture seule) ───────────────────────────────────────────────────────

def _main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "check"
    if cmd == "check":
        me = _request("GET", "/auth/v1/user", auth=True)
        print("auth OK — utilisateur :", (me[1] or {}).get("email"))
        for table in ("clients", "projets", "taches", "devis", "factures",
                      "planning_events", "settings", "activites"):
            print(f"  {table:16} {len(select(table, '', columns='id'))} ligne(s)")
    elif cmd == "clients":
        for c in clients():
            print(f"  {c['nom']} | {c.get('entreprise')} | {c.get('email')}")
    elif cmd == "devis":
        for d in devis():
            print(f"  {d['numero']} | {d.get('titre')} | {d.get('date')} | {d.get('statut')}")
    elif cmd == "next-numero":
        table = argv[2] if len(argv) > 2 else "devis"
        print(next_numero(table, "D-" if table == "devis" else "F-"))
    else:
        print(__doc__)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv))
