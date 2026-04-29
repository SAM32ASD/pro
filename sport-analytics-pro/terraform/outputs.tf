output "app_public_ip" {
  description = "IP publique de l'EC2"
  value       = aws_instance.app.public_ip
}

output "app_url" {
  description = "URL pour tester l'app"
  value       = "http://${aws_instance.app.public_ip}"
}

output "ssh_command" {
  description = "Commande SSH pour se connecter"
  value       = "ssh -i ${path.module}/ssh/${var.project_name}-key.pem ec2-user@${aws_instance.app.public_ip}"
}

output "rds_endpoint" {
  description = "Endpoint RDS (accessible uniquement depuis l'EC2)"
  value       = aws_db_instance.this.address
}

output "database_url" {
  description = "URL de connexion Postgres (sensible)"
  value       = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.address}:5432/${var.db_name}"
  sensitive   = true
}

output "init_db_command" {
  description = "Commande pour initialiser le schema (a executer une fois apres le deploy)"
  value       = "ssh -i ${path.module}/ssh/${var.project_name}-key.pem ec2-user@${aws_instance.app.public_ip} 'psql \"$(grep DATABASE_URL ~/app/.env | cut -d= -f2-)\" -f -' < ../backend/database/init.sql"
}
