# Terraform — sport-analytics-pro

Provisionne sur AWS Free Tier en une commande :
- VPC par defaut (pas de NAT = zero cout)
- Security Groups (SSH + HTTP + Postgres inter-SG)
- Key pair SSH auto-generee (sauvegardee en `ssh/`)
- **RDS Postgres** `db.t3.micro` 20 GB (free tier 12 mois)
- **EC2** `t2.micro` Amazon Linux 2023 (free tier 12 mois)
- **Bootstrap automatique** : swap 2 GB, Docker, pull image Docker Hub, `docker compose up`

---

## Prerequis

- `aws configure` (deja fait chez toi)
- Terraform >= 1.5 ([install](https://developer.hashicorp.com/terraform/install))
- Image Docker Hub deja pushee (`elmefik96/sport-analytics:latest`)

---

## Utilisation

```bash
cd terraform

# 1. Config
cp terraform.tfvars.example terraform.tfvars
# Editer et mettre ta cle API Sports fraichement regeneree

# 2. Deployer (5-8 minutes)
./deploy.sh

# 3. Initialiser le schema DB (une seule fois)
./init-db.sh

# 4. Tester
curl $(terraform output -raw app_url)/health
```

---

## Commandes utiles

```bash
# Voir les outputs (IP, SSH, endpoint RDS)
terraform output

# Voir la DATABASE_URL (sensible)
terraform output -raw database_url

# SSH sur l'EC2
eval $(terraform output -raw ssh_command)

# Suivre les logs de l'app
ssh -i ssh/sport-analytics-key.pem ec2-user@$(terraform output -raw app_public_ip) \
  'cd app && docker compose logs -f'

# Voir la progression du bootstrap user_data
ssh -i ssh/sport-analytics-key.pem ec2-user@$(terraform output -raw app_public_ip) \
  'sudo tail -f /var/log/cloud-init-output.log'
```

---

## Mise a jour de l'app (nouvelle image Docker)

Quand tu pushes une nouvelle image sur Docker Hub :

```bash
# Depuis ton PC
cd ..
./build-and-push.sh v2

# Sur l'EC2 (une ligne)
ssh -i terraform/ssh/sport-analytics-key.pem \
  ec2-user@$(cd terraform && terraform output -raw app_public_ip) \
  'cd app && docker compose pull && docker compose up -d'
```

Pas besoin de `terraform apply` — le Terraform n'a pas change.

---

## Destruction

```bash
./destroy.sh
# Taper "DETRUIRE" pour confirmer
```

Detruit :
- EC2, RDS (sans snapshot final), Security Groups, key pair, subnets RDS
- Le dossier `ssh/` local

**Ne detruit pas** :
- Le VPC par defaut (pas cree par nous)
- L'image Docker Hub (separe)

---

## Cout estime apres free tier (12 mois)

| Ressource | Cout approx |
|---|---|
| EC2 t2.micro on-demand | ~8.50 $/mois |
| RDS db.t3.micro | ~13 $/mois |
| RDS storage 20 GB gp2 | ~2.30 $/mois |
| EBS 10 GB gp3 | ~0.80 $/mois |
| Data transfer | variable |
| **Total** | **~25 $/mois** |

Pendant les 12 premiers mois : **0 $** si tu respectes les 750 h/mois.

**Alerte budget** : cree une alerte a 1 $ dans AWS Billing -> Budgets des maintenant.

---

## Fichiers

```
versions.tf             Providers + contraintes de version
variables.tf            Variables d'entree
terraform.tfvars.example Template des valeurs (api_sports_key)
network.tf              VPC default + Security Groups
keypair.tf              SSH key auto-generee
rds.tf                  RDS Postgres
ec2.tf                  EC2 + user_data (bootstrap complet)
outputs.tf              IP, URL, commandes SSH, DATABASE_URL
deploy.sh               Wrapper: init + plan + apply
destroy.sh              Wrapper: destroy + cleanup
init-db.sh              Execute backend/database/init.sql sur la RDS
.gitignore              Exclut state, tfvars, ssh/
```
