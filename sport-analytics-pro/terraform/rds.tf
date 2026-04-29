resource "random_password" "db" {
  length  = 24
  special = false # evite les caracteres problematiques dans l'URL
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
  tags       = { Name = "${var.project_name}-db-subnets" }
}

resource "aws_db_instance" "this" {
  identifier             = "${var.project_name}-db"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  storage_type           = "gp2"
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.db.result
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.this.name
  publicly_accessible    = false
  skip_final_snapshot    = true
  backup_retention_period = 1
  apply_immediately      = true

  tags = { Name = "${var.project_name}-db" }
}
