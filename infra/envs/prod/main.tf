locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags
  )
}

# Phase 3: wire module blocks here, for example:
# module "network" {
#   source = "../../modules/network"
#   ...
# }
