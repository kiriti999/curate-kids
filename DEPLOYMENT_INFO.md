# Live Deployment Information

**Status:** ✅ Deployed on AWS (ap-south-1)
**Date:** 2026-01-21

## Lambda Function URLs

These are the live endpoints for your license server. No API Gateway is required.

### 1. Verify License (Public)
**URL:** `https://qr4uign67ucohx2dogu2xq7neq0rjonz.lambda-url.ap-south-1.on.aws/`
- **Method:** POST
- **Body:** `{ "key": "ck_..." }`
- **Used by:** `@curatekids/deploy` CLI to validate customer keys.

### 2. Register Deployment (Public)
**URL:** `https://e3ukc7oeybqvsf27dhrsug25my0psezs.lambda-url.ap-south-1.on.aws/`
- **Method:** POST
- **Headers:** `Authorization: License ck_...`
- **Body:** `{ "projectName": "...", "frontendUrl": "...", ... }`
- **Used by:** `@curatekids/deploy` CLI to track usage.

### 3. Razorpay Webhook (Secret)
**URL:** `https://nk3yd6cab52l2d2ats3xe4ydda0pfmqh.lambda-url.ap-south-1.on.aws/`
- **Method:** POST
- **Events:** `payment.captured`
- **Used by:** Razorpay to auto-generate licenses upon payment.

## Configuration

**CLI Configuration:**
The CLI has been updated in `packages/deploy-cli/src/services/license.ts` to use these URLs by default.

**Webhook Configuration:**
1. Go to Razorpay Dashboard > Webhooks.
2. Add the Webhook URL above.
3. Select event: `payment.captured`.
4. Set Secret (must match `RAZORPAY_WEBHOOK_SECRET` in Lambda env).

## Payment Model: One-Time Setup

The webhook logic has been updated to support **One-Time Setup Fee** (Lifetime License).

- **Event:** `payment.captured`
- **License Validity:** 100 Years (Lifetime)
- **Deployment Limit:**
  - Default: 1 (Starter)
  - If `payment.notes.tier` is set: uses that tier.
  - If `payment.amount >= 500000` (5000 INR): Pro (3 deployments)
  - If `payment.amount >= 1000000` (10000 INR): Enterprise (Unlimited)

## Next Steps

1. **Configure Webhook** in Razorpay Dashboard.
2. **Build Bundles** (`scripts/build-bundles/build-all.sh`).
3. **Distribute CLI** (`npm publish packages/deploy-cli`).
