# License Server - Simplified Architecture

## Overview

Instead of a dedicated Node.js server, we'll use **AWS Lambda + API Gateway** with your existing MongoDB.

## Why This Approach?

### Advantages
- ✅ **Serverless** - No servers to manage
- ✅ **Cost-effective** - Pay per request (~$0.20 per million)
- ✅ **Auto-scaling** - Handles any load
- ✅ **Existing infrastructure** - Uses your MongoDB
- ✅ **Razorpay integration** - Uses whatsnxt.in payment gateway

### Cost Comparison

**Traditional Server:**
- EC2 t3.micro: $8/month minimum
- Always running (wastes money)

**Serverless (Lambda):**
- First 1M requests: FREE
- After: $0.20 per million
- 10,000 customers × 100 verifications/month = FREE
- Only pay when actually used

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Customer runs: curatedreels-deploy                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  API Gateway: api.curatedreels.com                    │
│  Routes:                                            │
│  • POST /verify                                     │
│  • POST /register-deployment                        │
│  • POST /webhook (Razorpay)                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  AWS Lambda Functions                               │
│  • verifyLicense(licenseKey)                        │
│  • registerDeployment(data)                         │
│  • handleRazorpayWebhook(event)                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  MongoDB Atlas (your existing cluster)              │
│  Collection: licenses                               │
│  {                                                   │
│    licenseKey,                                      │
│    customerId,                                      │
│    email,                                           │
│    tier,                                            │
│    status,                                          │
│    expiresAt,                                       │
│    maxDeployments,                                  │
│    currentDeployments,                              │
│    razorpaySubscriptionId                           │
│  }                                                   │
└─────────────────────────────────────────────────────┘
```

## Lambda Functions

### 1. verify-license
```javascript
// Input: { licenseKey }
// Output: { valid: boolean }

exports.handler = async (event) => {
  const { licenseKey } = JSON.parse(event.body);
  
  // Connect to MongoDB
  const license = await db.collection('licenses').findOne({ 
    licenseKey,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  
  if (!license) {
    return { statusCode: 401, body: 'Invalid license' };
  }
  
  if (license.currentDeployments >= license.maxDeployments) {
    return { statusCode: 403, body: 'Deployment limit reached' };
  }
  
  return { statusCode: 200, body: JSON.stringify({ valid: true }) };
};
```

### 2. register-deployment
```javascript
// Input: { licenseKey, projectName, urls }
// Output: { deploymentId }

exports.handler = async (event) => {
  const { licenseKey, projectName, frontendUrl, cmsUrl, botUrl } = JSON.parse(event.body);
  
  // Increment deployment count
  await db.collection('licenses').updateOne(
    { licenseKey },
    { $inc: { currentDeployments: 1 } }
  );
  
  // Record deployment
  await db.collection('deployments').insertOne({
    licenseKey,
    projectName,
    frontendUrl,
    cmsUrl,
    botUrl,
    createdAt: new Date()
  });
  
  return { statusCode: 200 };
};
```

### 3. razorpay-webhook
```javascript
// Handles subscription events from whatsnxt.in
exports.handler = async (event) => {
  const webhookEvent = JSON.parse(event.body);
  
  if (webhookEvent.event === 'subscription.activated') {
    // Create license
    const licenseKey = generateLicenseKey();
    await db.collection('licenses').insertOne({
      licenseKey,
      customerId: webhookEvent.payload.subscription.customer_id,
      email: webhookEvent.payload.subscription.customer_email,
      tier: getTierFromPlan(webhookEvent.payload.subscription.plan_id),
      status: 'active',
      expiresAt: new Date(webhookEvent.payload.subscription.current_end),
      maxDeployments: getMaxDeployments(tier),
      currentDeployments: 0,
      razorpaySubscriptionId: webhookEvent.payload.subscription.id
    });
    
    // Email license key to customer
    await sendEmail({
      to: email,
      subject: 'Your CuratedReels License',
      body: `License Key: ${licenseKey}`
    });
  }
  
  return { statusCode: 200 };
};
```

## Razorpay Integration

### Using whatsnxt.in

Since you already have Razorpay on whatsnxt.in:

**Option 1: Redirect to whatsnxt.in**
```
curatedreels.com/pricing
  ↓
whatsnxt.in/curatedreels-checkout
  ↓
Razorpay payment
  ↓
Webhook → Lambda → Create license
  ↓
Email license to customer
```

**Option 2: Embed on curatedreels.com**
```javascript
// On curatedreels.com/pricing
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

const options = {
  key: 'YOUR_RAZORPAY_KEY', // Same as whatsnxt.in
  subscription_id: 'sub_xxx',
  name: 'CuratedReels',
  description: 'Monthly Subscription',
  handler: function(response) {
    // Send to your webhook
    fetch('https://api.curatedreels.com/webhook/razorpay', {
      method: 'POST',
      body: JSON.stringify(response)
    });
  }
};

new Razorpay(options).open();
```

## CloudFront - Why It's Needed

### Without CloudFront (Direct S3)

```
Customer (India) → S3 (us-east-1) → Download 20MB
                    ↑
                  Slow! (~30-60s)
```

**Problems:**
- ❌ Slow downloads (S3 is in one region)
- ❌ No HTTPS on bucket URLs (security issue)
- ❌ Difficult access control
- ❌ High S3 costs for traffic

### With CloudFront (CDN)

```
Customer (India) → CloudFront Edge (Mumbai) → Download 20MB
                    ↑
                  Fast! (~5-10s)
                  Cached locally
```

**Benefits:**
- ✅ **Fast** - Content cached in 400+ locations worldwide
- ✅ **HTTPS** - Free SSL certificate
- ✅ **Secure** - Signed URLs for license-based access
- ✅ **Cheaper** - CloudFront bandwidth cheaper than S3

**Cost Comparison:**
- S3 data transfer: $0.09/GB
- CloudFront: $0.085/GB (first 10TB)
- **Savings:** ~40% cheaper + faster

### CloudFront Setup (1-click)

```bash
# In AWS Console:
1. Create CloudFront distribution
2. Origin: Your S3 bucket
3. Enable: Restrict Bucket Access
4. Auto-generates SSL certificate
5. Done! (takes 15 minutes to deploy)
```

**Result:** `https://d123abc.cloudfront.net` → Fast, secure, cheap

## DNS Configuration - Why It's Needed

### Without DNS (Using AWS URLs)

**Ugly URLs:**
```
S3: https://curatedreels-releases.s3.amazonaws.com/v1.0.0/frontend.zip
CloudFront: https://d123abc456def.cloudfront.net/v1.0.0/frontend.zip
```

**Problems:**
- ❌ Hard to remember
- ❌ Not professional
- ❌ Can't change if you migrate

### With DNS (Custom Domain)

**Clean URLs:**
```
https://releases.curatedreels.com/v1.0.0/frontend.zip
```

**Setup:**
1. Buy domain: `curatedreels.com` (Already have?)
2. Add DNS record in Route 53 or your DNS provider:
   ```
   releases.curatedreels.com → CNAME → d123abc.cloudfront.net
   ```
3. Done!

**Benefits:**
- ✅ Professional
- ✅ Branded
- ✅ Can change backend anytime
- ✅ SSL auto-works

### Simple DNS Setup

If you have `curatedreels.com` in Route 53:

```bash
# Add one record:
Type: CNAME
Name: releases
Value: d123abc.cloudfront.net (your CloudFront URL)
TTL: 300
```

**Result:** `releases.curatedreels.com` → Your bundles (fast & secure)

## Can You Skip CloudFront & DNS?

**Yes, for testing:**
```
Use S3 URLs directly:
https://curatedreels-releases.s3.amazonaws.com/...
```

**But for production:**
```
CloudFront + DNS is worth it:
• 15 minutes to set up
• Saves $$ long-term
• Much faster for customers
• More professional
```

## Recommended Minimal Setup

### Phase 1: MVP (This Week)
1. ✅ Create S3 bucket
2. ✅ Upload bundles manually
3. ✅ Use S3 URLs (ugly but works)
4. ✅ Create Lambda functions
5. ✅ Test deployment

### Phase 2: Production (Next Week)
6. Add CloudFront (1 click)
7. Add DNS record (1 minute)
8. Connect Razorpay webhook
9. Launch!

## Cost Breakdown (Monthly)

### Your Infrastructure
- S3 storage (1GB): $0.023/month
- Lambda (10K requests): FREE (under free tier)
- API Gateway (10K requests): FREE (under free tier)
- CloudFront (100GB transfer): $8.50/month
- **Total: ~$9/month** (supports unlimited customers)

### Per Customer Revenue
- Starter: $49/month
- Pro: $149/month

**Break-even:** 1 customer  
**Profit with 10 customers:** $481/month (Starter tier)

## Implementation Time

| Task | Time | Priority |
|------|------|----------|
| Create S3 bucket | 5 min | ✅ High |
| Create Lambda functions | 2-3 hours | ✅ High |
| Set up API Gateway | 30 min | ✅ High |
| Connect MongoDB | 30 min | ✅ High |
| Razorpay webhook | 1 hour | ✅ High |
| CloudFront setup | 15 min | Medium |
| DNS configuration | 5 min | Medium |
| Testing | 2 hours | ✅ High |
| **Total** | **1 day** | - |

## Simplified Plan

**Day 1 (Your existing AWS + MongoDB):**
1. Create S3 bucket → Upload bundles
2. Create 3 Lambda functions → Deploy
3. Create API Gateway → Connect Lambdas
4. Add Razorpay webhook → Test
5. Test end-to-end deployment

**Day 2 (Polish):**
6. Add CloudFront (optional but recommended)
7. Add DNS (optional but recommended)
8. Create customer dashboard (simple landing page)

**Result:** Production-ready white-label SaaS in 1-2 days!

---

Want me to create the Lambda functions now?
