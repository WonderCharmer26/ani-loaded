# Terraform Modules

Each subfolder is a reusable module consumed by environment compositions under envs/dev and envs/prod.

Recommended convention:

- Keep modules generic.
- Keep environment-specific values in env terraform.tfvars files.
