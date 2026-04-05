# AniLoaded AWS Deployment Runbook (Local Working Plan)

This runbook is for the target hosting model:
- Frontend: S3 + CloudFront
- Backend API: ECS Fargate + ALB
- Container registry: ECR
- DNS/TLS: Route53 + ACM
- Secrets/config: Secrets Manager
- CI/CD: GitHub Actions with OIDC role already created

## Outcome
At the end of this runbook, you will have:
1. Terraform-managed AWS infrastructure for dev and prod.
2. Separate GitHub Actions workflow for infrastructure updates.
3. Separate GitHub Actions workflow for application deployments.
4. Security PR workflow.
5. Scheduled security workflow.

## Phase 0 - Prerequisites
1. Confirm AWS account and hosted zone are ready.
2. Confirm GitHub repo admin permissions for Actions and Environments.
3. Confirm OIDC role trust policy allows this repository and branches.
4. Decide regions:
   - Main workload region (ECS, ALB, ECR, Secrets Manager).
   - us-east-1 for ACM cert used by CloudFront (required).
5. Decide domain strategy:
   - frontend: app.example.com
   - backend api: api.example.com

## Phase 1 - Terraform Repository Layout
Use this structure:
1. infra/modules
   - network
   - ecr
   - ecs_service
   - alb
   - cloudfront_s3_frontend
   - route53_records
   - secrets
2. infra/envs/dev
   - main.tf
   - variables.tf
   - outputs.tf
   - terraform.tfvars
3. infra/envs/prod
   - main.tf
   - variables.tf
   - outputs.tf
   - terraform.tfvars

Guideline:
- Keep modules generic.
- Keep per-environment values only in env folders.

## Phase 2 - Remote State and Bootstrapping
1. Create Terraform state bucket and lock table first.
2. Enable bucket versioning and encryption.
3. Add backend config in dev and prod envs.
4. Validate with:
   - terraform init
   - terraform validate

Recommended state naming:
- bucket: aniloaded-tfstate-<account-id>
- key dev: infra/dev/terraform.tfstate
- key prod: infra/prod/terraform.tfstate
- lock table: aniloaded-terraform-locks

## Phase 3 - Core Infrastructure (Dev First)
Deploy in this order:
1. Networking
   - VPC
   - public/private subnets
   - NAT (or cost-optimized egress strategy)
   - route tables
   - security groups
2. Container registry
   - ECR repositories for backend image
3. Secrets and config
   - Secrets Manager entries for runtime env vars
4. Backend compute
   - ECS cluster
   - Fargate service
   - ALB + target group + listener
   - health checks
5. Frontend hosting
   - S3 bucket for static assets
   - CloudFront distribution
   - OAC/OAI for private bucket access
6. TLS and DNS
   - ACM cert in us-east-1 for CloudFront
   - ACM cert in workload region for ALB
   - Route53 A/AAAA alias records for app and api

Important checks:
- Backend health endpoint should pass ALB health checks.
- CloudFront origin access should block direct public S3 access.

## Phase 4 - Application Runtime Contracts
Define runtime contract now so app deploys are deterministic.

Backend env vars in Secrets Manager (example names):
- /aniloaded/dev/SUPABASE_URL
- /aniloaded/dev/SUPABASE_KEY
- /aniloaded/dev/STORAGE_KEY_DISCUSSION

Frontend build env vars (set in workflow at build time):
- VITE_BACKEND_URL=https://api.example.com
- VITE_SUPABASE_URL=<supabase-url>
- VITE_SUPABASE_KEY=<supabase-anon-key>

CORS:
- Allow frontend CloudFront domain in FastAPI CORS config.

## Phase 5 - GitHub Environments and Secrets
Create environments:
1. dev
2. prod

Set environment protection:
- prod requires reviewer approval.

Set repository or environment secrets/vars:
- AWS_ROLE_TO_ASSUME
- AWS_REGION
- ECR_REPOSITORY
- ECS_CLUSTER
- ECS_SERVICE
- ECS_TASK_FAMILY
- S3_FRONTEND_BUCKET
- CLOUDFRONT_DISTRIBUTION_ID
- TF_STATE_BUCKET
- TF_LOCK_TABLE

Use environment-scoped values where dev and prod differ.

## Phase 6 - Workflow 1: Infrastructure Updates
Create workflow: .github/workflows/infra-terraform.yml

Triggers:
1. pull_request with paths under infra/**
2. push to main with paths under infra/**
3. workflow_dispatch

Behavior:
1. OIDC auth to AWS role.
2. Terraform fmt check, init, validate.
3. PR: plan only and post plan summary.
4. Push to main: apply to dev.
5. Prod apply only via manual dispatch with environment approval.

## Phase 7 - Workflow 2: Application Deployments
Create workflow: .github/workflows/deploy-application.yml

Triggers:
1. push to main with paths under App/**
2. workflow_dispatch with target environment input

Behavior:
1. Backend deploy job:
   - Build backend Docker image from App/backend
   - Push image to ECR
   - Render/update task definition
   - Deploy ECS service and wait for stability
2. Frontend deploy job:
   - Build frontend from App/frontend with production env vars
   - Sync build output to S3 bucket
   - Create CloudFront invalidation

Recommended:
- Deploy backend first, then frontend.
- Add rollback note: redeploy previous task definition revision if health fails.

## Phase 8 - Workflow 3: Security Scan on PR
Create workflow: .github/workflows/security-pr.yml

Triggers:
1. pull_request on main

Checks:
1. CodeQL for JavaScript/TypeScript and Python.
2. Dependency scans:
   - npm audit (frontend)
   - pip-audit (backend)
3. IaC scan on infra with Checkov or tfsec.
4. Container scan with Trivy for backend image context.

Policy suggestion:
- Fail PR on high/critical findings.

## Phase 9 - Workflow 4: Scheduled Security Scan
Create workflow: .github/workflows/security-scheduled.yml

Triggers:
1. schedule (daily or weekly cron)
2. workflow_dispatch

Checks:
- Re-run dependency, IaC, and container scanning against latest advisories.
- Upload SARIF or artifacts for audit trail.

## Phase 10 - End-to-End Validation Checklist
Infrastructure:
1. Terraform plan is clean for dev.
2. Route53 resolves app and api records.
3. Certificates are issued and attached correctly.

Backend:
1. ALB health checks pass.
2. API root and key routes respond.
3. ECS service remains stable after deploy.

Frontend:
1. CloudFront serves latest build.
2. SPA routing works for deep links.
3. Browser requests hit api domain successfully.

Security:
1. PR scan workflow runs on every PR.
2. Scheduled scan executes on cron.
3. Findings are visible and triaged.

## Phase 11 - Production Promotion Strategy
1. Merge to main deploys dev automatically.
2. Promote to prod via workflow dispatch with approval.
3. Use immutable image tags and keep deployment records.
4. Keep terraform prod apply manual with approval.

## First Concrete Actions (Do These Next)
1. Implement Terraform base in infra/envs/dev first.
2. Stand up dev infra manually from local machine.
3. Confirm backend reachable via ALB DNS and frontend via CloudFront DNS.
4. Add infra workflow and validate plan/apply behavior.
5. Add app deploy workflow and confirm one successful end-to-end deploy.
6. Add both security workflows.

## Notes for This Repository
1. Current infra directories are empty; start by creating module and env files.
2. Current backend CORS allows localhost frontend only; update for CloudFront domain in production.
3. Keep Supabase keys out of repo and inject through Secrets Manager and workflow secrets.
