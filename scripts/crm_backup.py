#!/usr/bin/env python3
"""Sauvegarde du CRM admin (Supabase) — export JSON complet, versionné localement.

Le CRM de L'Agence de Scott ne vit que chez Supabase : ni export, ni copie. Cette
sauvegarde est le filet en cas de fausse manœuvre (suppression, écriture erronée).

Le dossier de sortie est **hors** du dépôt de l'agence, qui est public : noms, emails,
téléphones et montants de clients n'ont rien à y faire. Le script refuse d'écrire dans un
dossier suivi par git (sauf si ce dossier est lui-même le dépôt de sauvegarde).

    python3 scripts/crm_backup.py                 # export daté du jour
    python3 scripts/crm_backup.py --out ~/backups/agence-crm
    python3 scripts/crm_backup.py --list          # inventaire des sauvegardes
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import crm_agent as crm  # noqa: E402

TABLES = ("clients", "projets", "taches", "devis", "devis_lignes", "factures",
          "factures_lignes", "planning_events", "settings", "activites")
# Les tables de lignes n'ont pas de created_at : trier dessus fait échouer PostgREST (42703).
ORDER = {
    "devis_lignes": "order=position.asc",
    "factures_lignes": "order=position.asc",
    "settings": "",
}
DEFAULT_OUT = pathlib.Path.home() / "backups" / "agence-crm"


def _inside_foreign_git_repo(path: pathlib.Path) -> bool:
    """Vrai si le dossier tombe dans un dépôt git autre que lui-même.

    Le dossier cible n'existe pas encore au moment du contrôle : `git rev-parse` échoue sur un
    chemin inexistant et répondrait « pas un dépôt » — on interroge donc le premier parent existant.
    """
    probe = path
    while not probe.exists() and probe != probe.parent:
        probe = probe.parent
    try:
        top = subprocess.run(["git", "-C", str(probe), "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception:
        return False
    if not top:
        return False
    return pathlib.Path(top).resolve() != path.resolve()


def export(out_dir: pathlib.Path, date: str | None = None) -> pathlib.Path:
    date = date or datetime.date.today().isoformat()
    if _inside_foreign_git_repo(out_dir):
        raise SystemExit(
            f"Refus : {out_dir} est suivi par un dépôt git existant.\n"
            "Les données clients ne doivent pas entrer dans un dépôt partagé/public.\n"
            "Utiliser ~/backups/agence-crm (dépôt local privé) ou un argument --out dédié."
        )
    out_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "exported_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "source": crm._URL,
        "tables": {t: crm.select(t, ORDER.get(t, "order=created_at.asc")) for t in TABLES},
    }
    target = out_dir / f"crm-{date}.json"
    tmp = target.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    # Contrôle avant remplacement : un export tronqué ne doit pas écraser un bon fichier.
    reparsed = json.loads(tmp.read_text(encoding="utf-8"))
    counts = {t: len(reparsed["tables"][t]) for t in TABLES}
    # Factures et lignes peuvent être légitimement vides ; ces trois tables, non.
    missing = [t for t in ("clients", "devis", "activites") if counts[t] == 0]
    if missing:
        tmp.unlink(missing_ok=True)
        raise SystemExit(f"Export suspect (table vide alors qu'elle ne devrait pas l'être) : {missing}")
    os.replace(tmp, target)
    return target


def _main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--date", default=None, help="AAAA-MM-JJ (défaut : aujourd'hui)")
    ap.add_argument("--list", action="store_true", help="lister les sauvegardes existantes")
    args = ap.parse_args(argv[1:])

    out_dir = pathlib.Path(os.path.expanduser(args.out))
    if args.list:
        files = sorted(out_dir.glob("crm-*.json"))
        if not files:
            print(f"aucune sauvegarde dans {out_dir}")
            return 0
        for f in files:
            print(f"  {f.name}  {f.stat().st_size / 1024:.0f} Ko")
        return 0

    target = export(out_dir)
    data = json.loads(target.read_text(encoding="utf-8"))
    print(f"sauvegarde : {target}  ({target.stat().st_size / 1024:.0f} Ko)")
    for t in TABLES:
        print(f"  {t:16} {len(data['tables'][t])} ligne(s)")
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv))
