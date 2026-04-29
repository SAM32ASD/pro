# Deploiement AWS Free Tier — sport-analytics-pro

Pipeline: **Build local (ton PC) -> Docker Hub (image publique) -> Pull sur EC2 t2.micro**.

## Architecture

```
[PC Windows]                  [Docker Hub]                    [AWS]
docker build    ----push---->  elmefik96/sport-analytics  --pull-->  EC2 t2.micro
                                                                      |
                                                                      +--> RDS Postgres (Free Tier)
```

- **1 seul conteneur** : Node API sert aussi le `frontend/dist/` (plus leger)
- **Redis desactive** : cache memoire en fallback (le code le supporte)
- **RDS separe** : Postgres db.t3.micro (12 mois gratuits, 20 GB)

---

## 1. Depuis ton PC — Build et push de l'image

```bash
cd C:/Users/jobel/Desktop/pro/sport-analytics-pro

# Build + push (image tag "latest" + un tag version)
./build-and-push.sh v1
# ou simplement:
./build-and-push.sh
```

Taille attendue : ~150-180 MB (Node20-alpine + deps + dist).

Verifie la taille :
```bash
docker images elmefik96/sport-analytics
```

---

## 2. Sur AWS — Creer l'infrastructure (une seule fois)

### 2.1 RDS Postgres Free Tier

1. Console AWS -> RDS -> **Create database**
2. Engine: **PostgreSQL**
3. Template: **Free tier**
4. Instance: `db.t3.micro` (1 GB RAM, inclus)
5. Storage: **20 GB gp2** (inclus)
6. Identifier: `sport-db`
7. Master user: `sportuser` / password fort
8. Public access: **No** (reco) ou Yes si acces depuis ton PC pour tester
9. VPC security group: creer un groupe qui autorise port **5432** depuis le **security group de l'EC2** (pas depuis 0.0.0.0/0)
10. Initial database name: `sport_analytics`
11. Backup retention: **1 jour** (limiter le stockage)
12. Create database -> recupere l'endpoint `sport-db.xxx.rds.amazonaws.com`

### 2.2 EC2 t2.micro

1. EC2 -> **Launch instance**
2. AMI: **Amazon Linux 2023** (minimal, leger)
3. Instance type: **t2.micro** (1 vCPU, 1 GB RAM, gratuit 12 mois)
4. Key pair: creer ou utiliser une existante (telecharger le `.pem`)
5. Security group: autoriser **SSH (22)** depuis ton IP + **HTTP (80)** depuis `0.0.0.0/0`
6. Storage: 8-20 GB gp2 (free tier = 30 GB/mois total)
7. Launch

### 2.3 Installer Docker sur l'EC2

SSH en tant qu'`ec2-user`:

```bash
ssh -i ma-cle.pem ec2-user@<IP-EC2>

sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Docker Compose plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -sL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Re-login pour activer le groupe docker
exit
ssh -i ma-cle.pem ec2-user@<IP-EC2>
docker ps   # doit marcher sans sudo
```

### 2.4 Configurer le swap (important pour t2.micro 1 GB)

```bash
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## 3. Initialiser la base de donnees (une seule fois)

Depuis ton PC (ou l'EC2) avec `psql`:

```bash
psql "postgresql://sportuser:VOTRE_MDP@sport-db.xxx.rds.amazonaws.com:5432/sport_analytics" \
  -f backend/database/init.sql
```

---

## 4. Deployer l'app sur l'EC2

```bash
# Sur l'EC2
mkdir -p ~/sport-analytics && cd ~/sport-analytics

# Copier ces 3 fichiers depuis ton PC via scp:
#   docker-compose.yml
#   .env.example
#   deploy.sh
# Exemple (depuis ton PC):
#   scp -i ma-cle.pem docker-compose.yml .env.example deploy.sh ec2-user@<IP>:~/sport-analytics/

cp .env.example .env
nano .env    # remplir DATABASE_URL, API_SPORTS_KEY, JWT_SECRET

chmod +x deploy.sh
./deploy.sh
```

Tester :
```bash
curl http://localhost/health
# et depuis ton navigateur: http://<IP-EC2>/
```

---

## 5. Mettre a jour l'app (workflow repete)

**Sur ton PC** apres chaque modification du code:
```bash
./build-and-push.sh v2
```

**Sur l'EC2** :
```bash
cd ~/sport-analytics
./deploy.sh
```

---

## 6. Budget et limites free tier a surveiller

| Service | Free tier | A surveiller |
|---|---|---|
| EC2 t2.micro | 750 h/mois 12 mois | 1 seule instance allumee en continu |
| RDS db.t3.micro | 750 h/mois + 20 GB 12 mois | Multi-AZ desactive |
| Data transfer out | 100 GB/mois | Limiter les images/logs |
| EBS | 30 GB gp2/mois | 8-20 GB suffisent |

**Alerte facturation** : Billing -> Budgets -> creer un budget a 1 USD pour etre notifie si tu depasses.

---

## 7. Troubleshooting

| Symptome | Cause probable | Fix |
|---|---|---|
| `docker compose up` OOM kill | RAM saturee | Verifier le swap, reduire `mem_limit` |
| `ECONNREFUSED` vers RDS | Security group RDS n'autorise pas EC2 | Ajouter SG de l'EC2 dans l'inbound RDS (port 5432) |
| 401 sur toutes les routes | `JWT_SECRET` different entre deploys | Garder le meme secret en `.env` |
| Cache Redis errors | Normal, `REDIS_URL` absent -> fallback memoire | Ignorer |
| Build echec sur EC2 | Ne jamais build sur t2.micro | Toujours build en local puis push |

---

## Fichiers livres

```
Dockerfile               Multi-stage Node20-alpine (frontend build + backend + runtime)
.dockerignore            Exclut node_modules, dist, .env, .claude, tests, etc.
docker-compose.yml       1 seul service (app) + limites RAM
.env.example             Template des variables d'env
build-and-push.sh        Script a lancer sur ton PC
deploy.sh                Script a lancer sur l'EC2
DEPLOY_AWS.md            Ce guide
```
