variable "aws_region" {
  description = "Region AWS (free tier dispo dans toutes). Options: us-east-1, eu-west-3"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "eu-west-3"], var.aws_region)
    error_message = "Region doit etre us-east-1 ou eu-west-3."
  }
}

variable "project_name" {
  description = "Prefixe utilise pour nommer les ressources"
  type        = string
  default     = "sport-analytics"
}

variable "docker_image" {
  description = "Image Docker Hub a deployer"
  type        = string
  default     = "elmefik96/sport-analytics:latest"
}

variable "allowed_ssh_cidr" {
  description = "CIDR autorise pour SSH (ex: ton IP /32). '0.0.0.0/0' pour tester uniquement."
  type        = string
  default     = "0.0.0.0/0"
}

variable "db_username" {
  description = "Utilisateur maitre Postgres"
  type        = string
  default     = "sportuser"
}

variable "db_name" {
  description = "Nom de la base de donnees"
  type        = string
  default     = "sport_analytics"
}

variable "api_sports_key" {
  description = "Cle API api-sports.io (passer via TF_VAR_api_sports_key ou .tfvars)"
  type        = string
  sensitive   = true
}

variable "cors_origin" {
  description = "Origin autorise en CORS. '*' pour tester."
  type        = string
  default     = "*"
}

variable "instance_type" {
  description = "Type EC2 (t2.micro et t3.micro sont free tier eligible)"
  type        = string
  default     = "t2.micro"
}

variable "db_instance_class" {
  description = "Classe RDS (db.t3.micro ou db.t4g.micro sont free tier)"
  type        = string
  default     = "db.t3.micro"
}
