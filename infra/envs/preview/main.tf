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

# --- Networking ---
module "network" {
  source       = "../../modules/network"
  project_name = var.project_name
  environment  = var.environment
}

# --- Container Registry ---
module "ecr" {
  source       = "../../modules/ecr"
  project_name = var.project_name
  environment  = var.environment
}

# --- Load Balancer ---
module "alb" {
  source            = "../../modules/alb"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
}

# --- Frontend (S3 + CloudFront) with API reverse proxy ---
module "cloudfront_s3_frontend" {
  source       = "../../modules/cloudfront_s3_frontend"
  project_name = var.project_name
  environment  = var.environment
  alb_dns_name = module.alb.dns_name
}

# --- Backend Compute (ECS Fargate) ---
module "ecs_service" {
  source                = "../../modules/ecs_service"
  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.public_subnet_ids
  target_group_arn      = module.alb.target_group_arn
  alb_security_group_id = module.alb.security_group_id
  container_image       = "${module.ecr.repository_url}:latest"
  assign_public_ip      = true # using public subnets, no NAT gateway (cost-optimized)

  environment_variables = [
    { name = "SUPABASE_URL", value = var.supabase_url },
    { name = "SUPABASE_KEY", value = var.supabase_key },
    { name = "STORAGE_KEY_DISCUSSION", value = var.storage_key_discussion },
    { name = "CORS_ORIGINS", value = "https://${module.cloudfront_s3_frontend.cloudfront_domain_name}" },
  ]
}
