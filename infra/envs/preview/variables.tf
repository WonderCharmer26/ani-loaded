variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "preview"
}

variable "project_name" {
  description = "Project name used for tagging and naming."
  type        = string
  default     = "aniloaded"
}

variable "tags" {
  description = "Additional tags to apply to resources."
  type        = map(string)
  default     = {}
}

# --- Application secrets (passed via -var in CI) ---

variable "supabase_url" {
  description = "Supabase project URL."
  type        = string
  sensitive   = true
}

variable "supabase_key" {
  description = "Supabase anon/public key."
  type        = string
  sensitive   = true
}

variable "storage_key_discussion" {
  description = "Supabase storage key for discussions."
  type        = string
  sensitive   = true
}
