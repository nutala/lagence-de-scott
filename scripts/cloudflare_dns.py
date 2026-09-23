#!/usr/bin/env python3
"""Connecteur DNS Cloudflare — zone lagencedescott.fr.

Le jeton API est lu depuis l'environnement (CLOUDFLARE_API_TOKEN), sinon depuis le
fichier de secrets Hermes (~/.hermes/.env, 600). Il n'est jamais écrit dans ce dépôt.

Usage :
    python3 scripts/cloudflare_dns.py verify
    python3 scripts/cloudflare_dns.py list
    python3 scripts/cloudflare_dns.py backup [fichier.json]
    python3 scripts/cloudflare_dns.py dmarc <none|quarantine|reject>
    python3 scripts/cloudflare_dns.py add-cname <nom> <cible>
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request

ZONE = "lagencedescott.fr"
API = "https://api.cloudflare.com/client/v4"
SECRETS = pathlib.Path(os.environ.get("HERMES_HOME", pathlib.Path.home() / ".hermes")) / ".env"


def token() -> str:
    value = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not value and SECRETS.exists():
        for line in SECRETS.read_text().splitlines():
            line = line.strip()
            if line.startswith("CLOUDFLARE_API_TOKEN="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not value:
        raise SystemExit("CLOUDFLARE_API_TOKEN absent (environnement ou ~/.hermes/.env)")
    return value


def call(method: str, path: str, payload: dict | None = None) -> dict:
    req = urllib.request.Request(
        API + path,
        method=method,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"HTTP {exc.code}: {exc.read().decode()[:600]}") from exc


def zone_id() -> str:
    data = call("GET", "/zones?" + urllib.parse.urlencode({"name": ZONE}))
    if not data.get("result"):
        raise SystemExit(f"zone {ZONE} introuvable avec ce jeton")
    return data["result"][0]["id"]


def records() -> list[dict]:
    out: list[dict] = []
    page = 1
    while True:
        data = call("GET", f"/zones/{zone_id()}/dns_records?" + urllib.parse.urlencode(
            {"per_page": 100, "page": page}))
        out += data.get("result", [])
        info = data.get("result_info", {})
        if page >= info.get("total_pages", 1):
            return out
        page += 1


def find(name: str, rtype: str) -> dict | None:
    for rec in records():
        if rec["name"].lower() == name.lower() and rec["type"] == rtype:
            return rec
    return None


def upsert(name: str, rtype: str, content: str, proxied: bool = False, ttl: int = 3600) -> str:
    payload = {"type": rtype, "name": name, "content": content, "ttl": ttl}
    if rtype in ("A", "AAAA", "CNAME"):
        payload["proxied"] = proxied
    existing = find(name, rtype)
    if existing:
        call("PUT", f"/zones/{zone_id()}/dns_records/{existing['id']}", payload)
        return f"mis a jour : {rtype} {name}"
    call("POST", f"/zones/{zone_id()}/dns_records", payload)
    return f"cree : {rtype} {name}"


def accounts() -> list[dict]:
    return call("GET", "/accounts").get("result", [])


def verify() -> dict:
    """Jeton *account-owned* ou *user-owned* : les points d'entree different.

    Un jeton account-owned repond 401 sur /user/tokens/verify alors qu'il est valide :
    on tranche donc sur la lecture reelle de la zone, pas sur /user.
    """
    info: dict = {"zones": [], "accounts": [], "jeton": "inconnu"}
    data = call("GET", "/zones?" + urllib.parse.urlencode({"name": ZONE}))
    info["zones"] = [{"id": z["id"], "name": z["name"], "status": z["status"]} for z in data.get("result", [])]
    info["accounts"] = [{"id": a["id"], "name": a["name"]} for a in accounts()]
    info["jeton"] = "valide (account-owned)" if info["zones"] else "valide mais sans acces a la zone"
    return info


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "verify"
    if cmd == "verify":
        print(json.dumps(verify(), indent=2, ensure_ascii=False))
    elif cmd == "list":
        for rec in sorted(records(), key=lambda r: (r["type"], r["name"])):
            extra = " [proxied]" if rec.get("proxied") else ""
            print(f"{rec['type']:<6} {rec['name']:<42} {rec['content'][:70]}{extra}")
    elif cmd == "backup":
        dest = pathlib.Path(argv[2]) if len(argv) > 2 else pathlib.Path("data/dns_backup.json")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(records(), indent=2, ensure_ascii=False))
        print(f"{len(records())} enregistrements sauvegardes dans {dest}")
    elif cmd == "dmarc":
        policy = argv[2]
        value = (f"v=DMARC1; p={policy}; sp={policy}; adkim=r; aspf=r; pct=100; "
                 f"fo=1; rua=mailto:contact@{ZONE}")
        print(upsert(f"_dmarc.{ZONE}", "TXT", value))
        print("  " + value)
    elif cmd == "add-cname":
        print(upsert(argv[2], "CNAME", argv[3], proxied=False))
    else:
        raise SystemExit(__doc__)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
