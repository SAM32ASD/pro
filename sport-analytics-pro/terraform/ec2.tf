data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

locals {
  database_url = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.address}:5432/${var.db_name}"

  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail

    # Swap 2 GB indispensable sur t2.micro
    dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

    # Docker
    dnf update -y
    dnf install -y docker
    systemctl enable --now docker
    usermod -aG docker ec2-user

    # Docker Compose plugin
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -sSL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

    # Preparer le dossier app
    mkdir -p /home/ec2-user/app
    cat > /home/ec2-user/app/.env <<ENV
    NODE_ENV=production
    PORT=3000
    DATABASE_URL=${local.database_url}
    API_SPORTS_KEY=${var.api_sports_key}
    JWT_SECRET=${random_password.jwt.result}
    CORS_ORIGIN=${var.cors_origin}
    ENV

    cat > /home/ec2-user/app/docker-compose.yml <<'YAML'
    services:
      app:
        image: ${var.docker_image}
        container_name: sport-app
        ports: ["80:3000"]
        env_file: .env
        restart: unless-stopped
        mem_limit: 512m
        logging:
          driver: json-file
          options: { max-size: "10m", max-file: "3" }
    YAML

    chown -R ec2-user:ec2-user /home/ec2-user/app
    chmod 600 /home/ec2-user/app/.env

    # Attendre RDS puis initialiser le schema
    dnf install -y postgresql15
    for i in {1..30}; do
      pg_isready -h ${aws_db_instance.this.address} -p 5432 -U ${var.db_username} && break
      sleep 10
    done

    # Lancer l'app
    cd /home/ec2-user/app
    sudo -u ec2-user docker compose up -d

    echo "bootstrap done"
  EOT
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.deployer.key_name
  vpc_security_group_ids      = [aws_security_group.app.id]
  subnet_id                   = data.aws_subnets.default.ids[0]
  associate_public_ip_address = true
  user_data                   = local.user_data

  root_block_device {
    volume_size = 10
    volume_type = "gp3"
  }

  tags = { Name = "${var.project_name}-app" }

  depends_on = [aws_db_instance.this]
}
