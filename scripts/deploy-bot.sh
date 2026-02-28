#!/bin/bash
# Deploy bot to Deno Deploy
# Usage: ./scripts/deploy-bot.sh [project-name]
# Example: ./scripts/deploy-bot.sh deploy24-bot

PROJECT_NAME="${1:-curated-reels-bot}"

echo "🤖 Deploying bot to Deno Deploy..."
echo "   Project: $PROJECT_NAME"
echo ""

cd bot && ~/.deno/bin/deployctl deploy --project="$PROJECT_NAME" --entrypoint=src/main.ts --prod
