#!/usr/bin/env bash
# Deploiement AWS automatise via Terraform
# Prerequis: aws cli configure + terraform installe + terraform.tfvars rempli
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f terraform.tfvars ] && [ -z "${TF_VAR_api_sports_key:-}" ]; then
  echo "ERREUR: creer terraform.tfvars (copier terraform.tfvars.example)"
  echo "       ou exporter TF_VAR_api_sports_key=..."
  exit 1
fi

echo "==> Init Terraform"
terraform init -upgrade

echo "==> Plan"
terraform plan -out=tfplan

read -rp "Appliquer ce plan ? (oui/non) " confirm
[ "$confirm" = "oui" ] || { echo "Annule"; rm -f tfplan; exit 0; }

echo "==> Apply"
terraform apply tfplan
rm -f tfplan

PUBLIC_IP=$(terraform output -raw app_public_ip)
APP_URL=$(terraform output -raw app_url)
SSH_CMD=$(terraform output -raw ssh_command)
RDS_EP=$(terraform output -raw rds_endpoint)

echo ""
echo "==================================================="
echo " DEPLOIEMENT TERMINE"
echo "==================================================="
echo ""
echo "  IP PUBLIQUE EC2 : $PUBLIC_IP"
echo "  URL APP         : $APP_URL"
echo "  ENDPOINT RDS    : $RDS_EP"
echo ""
echo "  SSH             : $SSH_CMD"
echo ""
echo "==================================================="
echo ""
echo "Note: le bootstrap user_data prend 3-5 minutes"
echo "      (install docker + pull image + start conteneur)"
echo ""
echo "Tester dans ~5 min : curl $APP_URL/health"
echo ""
echo "Initialiser la base (une seule fois, apres le bootstrap):"
echo "  ./init-db.sh"
