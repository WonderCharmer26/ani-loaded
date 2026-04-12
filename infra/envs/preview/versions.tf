terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    key = "infra/preview/terraform.tfstate"
    # bucket, region, and dynamodb_table are passed via -backend-config in CI
    # or set here for local usage:
    # bucket         = "aniloaded-tfstate-ACCOUNT_ID"
    # region         = "us-east-1"
    # dynamodb_table = "aniloaded-terraform-locks"
    encrypt = true
  }
}
