variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. dev, preview, prod)."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the ALB will be created."
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB."
  type        = list(string)
}
