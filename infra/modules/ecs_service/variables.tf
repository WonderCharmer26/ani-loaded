variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. dev, preview, prod)."
  type        = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch log configuration."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the ECS security group."
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs where ECS tasks will run."
  type        = list(string)
}

variable "target_group_arn" {
  description = "ARN of the ALB target group."
  type        = string
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB (for ingress rules)."
  type        = string
}

variable "container_image" {
  description = "Full container image URI (e.g. account.dkr.ecr.region.amazonaws.com/repo:tag)."
  type        = string
}

variable "environment_variables" {
  description = "List of environment variable maps for the container."
  type        = list(object({ name = string, value = string }))
  default     = []
}

variable "cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory in MB."
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of task instances to run."
  type        = number
  default     = 1
}

variable "assign_public_ip" {
  description = "Assign a public IP to Fargate tasks (required if using public subnets without NAT)."
  type        = bool
  default     = true
}
