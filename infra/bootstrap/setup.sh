#!/usr/bin/env bash
# Bootstrap script to create a secure S3 backend for Terraform state.
# Run once per AWS account. Requires AWS CLI configured with admin credentials.
#
# Usage: ./setup.sh [REGION]
#   REGION defaults to us-east-1

set -euo pipefail

REGION="${1:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="aniloaded-tfstate-${ACCOUNT_ID}"
TABLE="aniloaded-terraform-locks"

echo "==> Creating Terraform state bucket: ${BUCKET} in ${REGION}"

# Create bucket (us-east-1 does not accept LocationConstraint)
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" 2>/dev/null || echo "Bucket already exists, continuing..."
else
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || echo "Bucket already exists, continuing..."
fi

echo "==> Enabling versioning"
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

echo "==> Blocking all public access"
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "==> Enabling default AES-256 encryption"
aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}, "BucketKeyEnabled": true}]
  }'

echo "==> Denying non-TLS requests via bucket policy"
aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"DenyInsecureTransport\",
      \"Effect\": \"Deny\",
      \"Principal\": \"*\",
      \"Action\": \"s3:*\",
      \"Resource\": [
        \"arn:aws:s3:::${BUCKET}\",
        \"arn:aws:s3:::${BUCKET}/*\"
      ],
      \"Condition\": {
        \"Bool\": { \"aws:SecureTransport\": \"false\" }
      }
    }]
  }"

echo "==> Creating DynamoDB lock table: ${TABLE}"
aws dynamodb create-table \
  --table-name "$TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" 2>/dev/null || echo "Table already exists, continuing..."

echo ""
echo "=== Bootstrap complete ==="
echo "Bucket:     ${BUCKET}"
echo "Lock table: ${TABLE}"
echo "Region:     ${REGION}"
echo ""
echo "Add this to your Terraform versions.tf backend config:"
echo ""
echo "  backend \"s3\" {"
echo "    bucket         = \"${BUCKET}\""
echo "    key            = \"infra/preview/terraform.tfstate\""
echo "    region         = \"${REGION}\""
echo "    dynamodb_table = \"${TABLE}\""
echo "    encrypt        = true"
echo "  }"
