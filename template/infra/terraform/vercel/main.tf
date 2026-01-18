# CurateKids Template - Vercel Infrastructure
# Creates Vercel project with environment variables

# Vercel Project for Frontend + Payload CMS
resource "vercel_project" "frontend" {
  name      = "${var.project_name}-frontend"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "your-org/curatekids-template"  # Update with actual repo
  }

  root_directory = "apps/frontend"

  build_command    = "pnpm build"
  output_directory = ".next"

  # Environment Variables
  environment = [
    # MongoDB
    {
      key    = "MONGODB_URI"
      value  = var.mongodb_uri
      target = ["production", "preview"]
    },
    {
      key    = "DATABASE_URI"
      value  = var.mongodb_uri
      target = ["production", "preview"]
    },

    # Payload CMS
    {
      key    = "PAYLOAD_SECRET"
      value  = random_password.payload_secret.result
      target = ["production", "preview"]
    },

    # Cloudinary
    {
      key    = "CLOUDINARY_CLOUD_NAME"
      value  = var.cloudinary_cloud_name
      target = ["production", "preview"]
    },
    {
      key    = "CLOUDINARY_API_KEY"
      value  = var.cloudinary_api_key
      target = ["production", "preview"]
    },
    {
      key    = "CLOUDINARY_API_SECRET"
      value  = var.cloudinary_api_secret
      target = ["production", "preview"]
    },

    # YouTube (optional)
    {
      key    = "YOUTUBE_API_KEY"
      value  = var.youtube_api_key
      target = ["production", "preview"]
    },

    # Next.js
    {
      key    = "NEXT_PUBLIC_SITE_URL"
      value  = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${var.project_name}-frontend.vercel.app"
      target = ["production"]
    },
  ]
}

# Generate random Payload secret
resource "random_password" "payload_secret" {
  length  = 32
  special = true
}

# Custom Domain (optional)
resource "vercel_project_domain" "custom" {
  count = var.custom_domain != "" ? 1 : 0

  project_id = vercel_project.frontend.id
  domain     = var.custom_domain
}

# Outputs
output "frontend_url" {
  description = "Frontend deployment URL"
  value       = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${var.project_name}-frontend.vercel.app"
}

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.frontend.id
}

output "payload_secret" {
  description = "Payload CMS secret (store securely)"
  value       = random_password.payload_secret.result
  sensitive   = true
}
