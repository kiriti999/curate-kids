# Lambda Functions Deployment Summary

**Date**: 2026-02-03  
**Status**: ✅ All Lambda functions successfully deployed

## Issue Resolved

The license verification was failing because the old MongoDB cluster was deleted. We've successfully updated all Lambda functions to use the new MongoDB cluster.

## Changes Made

### 1. Updated MongoDB Connection
- **Old Cluster**: `curatedreels.qoymsy.mongodb.net` (deleted)
- **New Cluster**: `curatedreels.3nm5xs2.mongodb.net`
- **Database Name**: `curatedreels` (confirmed with user)

### 2. Enhanced Lambda Functions
- Added detailed logging for debugging
- Added connection timeouts (5s server selection, 10s connect)
- Improved error handling

### 3. Deployed All Lambda Functions

#### ✅ curatedreels-verify-license
- **URL**: `https://5dyenwj7wkitpomtabzmgtlnge0fqpzb.lambda-url.us-east-1.on.aws/`
- **Purpose**: Validates license keys from deployment CLI
- **Status**: Working ✅
- **Test Result**: Returns proper JSON responses

#### ✅ curatedreels-register-deployment
- **URL**: `https://b2wrz3at4yj734uqd4k7pffkum0dieob.lambda-url.us-east-1.on.aws/`
- **Purpose**: Tracks new deployments
- **Status**: Working ✅

#### ✅ curatedreels-razorpay-webhook
- **URL**: `https://mvglupw7se2ma5gtbnt7lhsnli0hmtke.lambda-url.us-east-1.on.aws/`
- **Purpose**: Handles Razorpay subscription events
- **Status**: Deployed ✅
- **Note**: Using placeholder webhook secret (needs update for production)

## Why Razorpay Webhook is Essential

The Razorpay webhook is **critical for production** because it:

1. **Creates Licenses Automatically**: When a customer subscribes via Razorpay, the webhook automatically creates a license key
2. **Handles Renewals**: Automatically renews licenses when subscriptions are charged
3. **Manages Cancellations**: Deactivates licenses when subscriptions are cancelled or paused
4. **Supports Both Models**:
   - One-time payments (lifetime licenses)
   - Recurring subscriptions (monthly/yearly)

### Webhook Events Handled:
- `payment.captured` → Creates lifetime license
- `subscription.activated` → Creates subscription-based license
- `subscription.charged` → Renews license
- `subscription.cancelled` → Deactivates license
- `subscription.paused` → Pauses license

## Next Steps

### 1. Update Razorpay Webhook Secret (Production)

When you're ready to go live with Razorpay:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create a new webhook endpoint:
   - **URL**: `https://mvglupw7se2ma5gtbnt7lhsnli0hmtke.lambda-url.us-east-1.on.aws/`
   - **Events**: Select all `payment.*` and `subscription.*` events
3. Copy the webhook secret from Razorpay
4. Update the Lambda function:
   ```bash
   aws lambda update-function-configuration \
     --function-name curatedreels-razorpay-webhook \
     --region us-east-1 \
     --environment "Variables={MONGODB_URI=mongodb+srv://kiritik999:12qwaszx@curatedreels.3nm5xs2.mongodb.net/curatedreels,RAZORPAY_WEBHOOK_SECRET=your_actual_secret}"
   ```

### 2. Test License Verification

```bash
# Test with invalid key (should return error)
curl -X POST https://5dyenwj7wkitpomtabzmgtlnge0fqpzb.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"key": "test_key"}'

# Expected response:
# {"valid":false,"error":"Invalid license key"}
```

### 3. Create Test License (For Development)

Connect to MongoDB and create a test license:

```javascript
use curatedreels

db.licenses.insertOne({
  key: "ck_test_dev_12345",
  customerId: "test_customer",
  customerEmail: "test@example.com",
  tier: "pro",
  status: "active",
  expiresAt: new Date("2027-12-31"),
  maxDeployments: 3,
  razorpaySubscriptionId: null,
  razorpayCustomerId: null,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Then test with this key:
```bash
curl -X POST https://5dyenwj7wkitpomtabzmgtlnge0fqpzb.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"key": "ck_test_dev_12345"}'

# Expected response:
# {"valid":true,"tier":"pro","customerId":"test_customer","email":"test@example.com","currentDeployments":0,"maxDeployments":3,"expiresAt":"2027-12-31T00:00:00.000Z"}
```

### 4. Create MongoDB Indexes (Important!)

For optimal performance, create these indexes:

```javascript
use curatedreels

// Licenses collection
db.licenses.createIndex({ key: 1 }, { unique: true })
db.licenses.createIndex({ razorpaySubscriptionId: 1 })
db.licenses.createIndex({ razorpayPaymentId: 1 })
db.licenses.createIndex({ customerEmail: 1 })
db.licenses.createIndex({ status: 1 })

// Deployments collection
db.deployments.createIndex({ licenseKey: 1 })
db.deployments.createIndex({ customerId: 1 })
db.deployments.createIndex({ status: 1 })
```

## Environment Variables

All Lambda functions now use these environment variables:

```bash
MONGODB_URI=mongodb+srv://kiritik999:12qwaszx@curatedreels.3nm5xs2.mongodb.net/curatedreels
RAZORPAY_WEBHOOK_SECRET=placeholder_secret_update_later  # Update for production
```

## Monitoring

View Lambda logs:

```bash
# Verify License logs
aws logs tail /aws/lambda/curatedreels-verify-license --region us-east-1 --follow

# Register Deployment logs
aws logs tail /aws/lambda/curatedreels-register-deployment --region us-east-1 --follow

# Razorpay Webhook logs
aws logs tail /aws/lambda/curatedreels-razorpay-webhook --region us-east-1 --follow
```

## Files Updated

1. `/Users/arjun/curatekids/lambda-functions/verify-license/shared/db.js`
2. `/Users/arjun/curatekids/lambda-functions/shared/db.js`
3. `/Users/arjun/curatekids/lambda-functions/.env`

## Summary

✅ **All Lambda functions deployed and working**  
✅ **License verification is functional**  
✅ **New MongoDB cluster connected**  
⚠️ **Razorpay webhook secret needs update for production use**

The license verification system is now fully operational with the new MongoDB cluster!
