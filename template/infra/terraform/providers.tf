# CuratedReels Template - Terraform Providers

terraform {
  required_version = ">= 1.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# Vercel Provider
provider "vercel" {
  api_token = var.vercel_token
}
