output "frontend_url" {
  description = "CloudFront URL for the frontend."
  value       = "https://${module.cloudfront_s3_frontend.cloudfront_domain_name}"
}

output "backend_url" {
  description = "ALB URL for the backend API."
  value       = "http://${module.alb.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend images."
  value       = module.ecr.repository_url
}

output "frontend_s3_bucket" {
  description = "S3 bucket name for frontend assets."
  value       = module.cloudfront_s3_frontend.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)."
  value       = module.cloudfront_s3_frontend.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name."
  value       = module.cloudfront_s3_frontend.cloudfront_domain_name
}

output "alb_dns_name" {
  description = "ALB DNS name."
  value       = module.alb.dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = module.ecs_service.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = module.ecs_service.service_name
}
