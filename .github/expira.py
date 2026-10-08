"""Apaga as pastas cujo prazo em expiracoes.json venceu (gerado pelo
engine/vitrine.py do Suddenly WP-Forge). Nao edite aqui."""
import datetime
import json
import os
import shutil

agora = datetime.datetime.now(datetime.timezone.utc)
prazos = json.load(open("expiracoes.json", encoding="utf-8")) if os.path.exists("expiracoes.json") else {}
removidos = []
for cliente, quando in sorted(prazos.items()):
    if datetime.datetime.fromisoformat(quando.replace("Z", "+00:00")) <= agora:
        if os.path.isdir(cliente):
            shutil.rmtree(cliente)
        removidos.append(cliente)
for cliente in removidos:
    del prazos[cliente]
if removidos:
    with open("expiracoes.json", "w", encoding="utf-8", newline="\n") as fh:
        json.dump(prazos, fh, indent=2, sort_keys=True)
        fh.write("\n")
with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a", encoding="utf-8") as fh:
    fh.write("removidos=" + " ".join(removidos) + "\n")
print("vencidos:", ", ".join(removidos) or "nenhum", "| em aberto:", prazos or "nenhum")
