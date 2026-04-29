#!/usr/bin/env bash
# Destruction complete de l'infrastructure AWS
set -euo pipefail
cd "$(dirname "$0")"

echo "==================================================="
echo " DESTRUCTION de toute l'infra AWS de ce projet"
echo "==================================================="
echo "Ressources qui vont etre supprimees:"
terraform state list 2>/dev/null || { echo "Aucun state, rien a detruire"; exit 0; }
echo ""

read -rp "Taper 'DETRUIRE' pour confirmer: " confirm
[ "$confirm" = "DETRUIRE" ] || { echo "Annule"; exit 0; }

terraform destroy -auto-approve

rm -rf ssh/
echo ""
echo "OK. Toute l'infra a ete supprimee."
