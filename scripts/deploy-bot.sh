#!/bin/bash
# Deploy bot to Deno Deploy (console.deno.com)
# Usage: ./scripts/deploy-bot.sh
# The target app is read from the "deploy" block in bot/deno.json.
# Requires Deno 2.4+. The first run opens a browser to sign in.

echo "🤖 Deploying bot to Deno Deploy..."
echo ""

cd bot && deno deploy --prod
