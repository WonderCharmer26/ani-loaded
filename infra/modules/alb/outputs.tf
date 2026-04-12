output "dns_name" {
  description = "DNS name of the ALB."
  value       = aws_lb.main.dns_name
}

output "target_group_arn" {
  description = "ARN of the backend target group."
  value       = aws_lb_target_group.backend.arn
}

output "security_group_id" {
  description = "Security group ID of the ALB."
  value       = aws_security_group.alb.id
}
