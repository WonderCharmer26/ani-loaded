# Infrastructure Layout

This directory contains Terraform infrastructure for AniLoaded.

## Structure

- envs/dev: Dev environment composition files.
- envs/prod: Prod environment composition files.
- modules: Reusable Terraform modules.

## Modules

- network
- ecr
- ecs_service
- alb
- cloudfront_s3_frontend
- route53_records
- secrets

## Next Step

Proceed to Phase 2 by configuring remote state backend in each environment.
