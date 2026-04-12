variable "aws_region" {
  description = "Primary AWS region for workload resources."
  type        = string
}

variable "environment" {
  description = "Environment name, such as dev or prod."
  type        = string
}

variable "project_name" {
  description = "Project name used for tagging and naming resources."
  type        = string
  default     = "aniloaded"
}

variable "tags" {
  description = "Additional tags to apply to resources."
  type        = map(string)
  default     = {}
}
