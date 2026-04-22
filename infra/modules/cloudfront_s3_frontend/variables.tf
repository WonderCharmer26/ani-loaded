variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. dev, preview, prod)."
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB to proxy /api/* requests to."
  type        = string
}
