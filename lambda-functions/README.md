# CurateKids License Server - AWS Lambda

Serverless license verification system using AWS Lambda + MongoDB + Razorpay.

## Architecture

```
Customer CLI
     ↓
API Gateway (api.curatekids.com)
     ↓
┌────────────────────────────────────────┐
│  AWS Lambda Functions                  │
│  • verify-license                      │
│  •  register-deployment                 │
│  • razorpay-webhook                    │
└────────────────────────────────────────┘
     ↓
MongoDB Atlas (your existing cluster)
```

## Lambda Functions

### 1. verify-license
**Purpose:** Validate license keys from deployment CLI

**Endpoint:** `POST /v1/licenses/verify`

**Request:**
```json
{
  "key": "ck_abc123..."
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "pro",
  "currentDeployments": 1,
  "maxDeployments": 3,
  "expiresAt": "2026-02-21T00:00:00Z"
}
```

**Checks:**
- License exists
- Status is 'active'
- Not expired
- Under deployment limit

### 2. register-deployment
**Purpose:** Track new deployments

**Endpoint:** `POST /v1/deployments`

**Authorization:** `License ck_abc123...`

**Request:**
```json
{
  "projectName": "my-curatekids",
  "frontendUrl": "https://...",
  "cmsUrl": "https://...",
  "botUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "65abc...",
  "currentDeployments": 2,
  "maxDeployments": 3
}
```

### 3. razorpay-webhook
**Purpose:** Handle subscription events from Razorpay

**Endpoint:** `POST /v1/webhook/razorpay`

**Events Handled:**
- `subscription.activated` → Create license
- `subscription.charged` → Renew license
- `subscription.cancelled` → Deactivate license
- `subscription.paused` → Pause license

**Signature Verification:** Uses `X-Razorpay-Signature` header

## MongoDB Schema

### Collection: `licenses`

```javascript
{
  _id: ObjectId,
  licenseKey: String,              // "ck_abc123..." (unique)
  customerId: String,               // Razorpay customer ID
  email: String,                    // Customer email
  tier: String,                     // "starter" | "pro" | "enterprise"
  status: String,                   // "active" | "paused" | "cancelled"
  expiresAt: Date,                  // Subscription end date
  maxDeployments: Number,           // 1, 3, or 999
  currentDeployments: Number,       // Current count
  razorpaySubscriptionId: String,   // Razorpay subscription ID
  razorpayCustomerId: String,       // Razorpay customer ID
  createdAt: Date,
  updatedAt: Date,
  lastDeploymentAt: Date
}
```

### Collection: `deployments`

```javascript
{
  _id: ObjectId,
  licenseKey: String,
  customerId: String,
  projectName: String,
  frontendUrl: String,
  cmsUrl: String,
  botUrl: String,
  createdAt: Date,
  status: String                    // "active" | "deleted"
}
```

## Setup Instructions

### Prerequisites

1. **AWS Account** ✅ (you have)
2. **MongoDB Atlas** ✅ (you have)
3. **Razorpay Account** ✅ (whatsnxt.in)
4. **AWS CLI** installed

### Step 1: Configure AWS

```bash
# Install AWS CLI (if not installed)
# https://aws.amazon.com/cli/

# Configure credentials
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: ap-south-1 (Mumbai)
```

### Step 2: Create IAM Role

```bash
# Create execution role for Lambda
aws iam create-role \
  --role-name curatekids-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name curatekids-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get role ARN (save this)
aws iam get-role --role-name curatekids-lambda-role --query 'Role.Arn'
# Output: arn:aws:iam::123456789:role/curatekids-lambda-role
```

### Step 3: Set Environment Variables

```bash
export MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/curatekids-licenses'
export LAMBDA_ROLE='arn:aws:iam::123456789:role/curatekids-lambda-role'
export AWS_REGION='ap-south-1'
export RAZORPAY_WEBHOOK_SECRET='your-webhook-secret-from-razorpay'
```

### Step 4: Deploy Lambda Functions

```bash
cd lambda-functions
chmod +x deploy.sh
./deploy.sh
```

This will:
- Install dependencies
- Create 3 Lambda functions
- Upload code
- Configure environment variables

### Step 5: Create API Gateway

#### Option A: AWS Console (Easy)

1. Go to **API Gateway** in AWS Console
2. Create **REST API**
3. Create resources:
   ```
   /v1
     /licenses
       /verify (POST)
     /deployments (POST)
     /webhook
       /razorpay (POST)
   ```
4. For each endpoint:
   - Integration type: Lambda Function
   - Select corresponding function
   - Enable CORS
5. Deploy API to "prod" stage
6. Note the invoke URL: `https://abc123.execute-api.ap-south-1.amazonaws.com/prod`

#### Option B: AWS CLI (Advanced)

```bash
# Create API
API_ID=$(aws apigateway create-rest-api \
  --name 'CurateKids License API' \
  --region ap-south-1 \
  --query 'id' \
  --output text)

# Get root resource
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --region ap-south-1 \
  --query 'items[0].id' \
  --output text)

# Create /v1 resource
# ... (full script available in setup-api-gateway.sh)
```

### Step 6: Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Webhooks
2. Create webhook:
   - URL: `https://YOUR-API-URL/v1/webhook/razorpay`
   - Events: subscription.*
   - Secret: (save this as RAZORPAY_WEBHOOK_SECRET)
3. Update Lambda environment variable with secret

### Step 7: Create MongoDB Indexes

```javascript
// Connect to your MongoDB cluster
use curatekids-licenses

// Create indexes
db.licenses.createIndex({ licenseKey: 1 }, { unique: true })
db.licenses.createIndex({ razorpaySubscriptionId: 1 })
db.licenses.createIndex({ email: 1 })
db.licenses.createIndex({ status: 1 })

db.deployments.createIndex({ licenseKey: 1 })
db.deployments.createIndex({ customerId: 1 })
```

### Step 8: Test Endpoints

```bash
# Test verify license
curl -X POST https://YOUR-API-URL/v1/licenses/verify \
  -H "Content-Type: application/json" \
  -d '{"key": "ck_test123"}'

# Should return:
# {"valid": false, "error": "Invalid or inactive license key"}
```

### Step 9: Create Test License (Manual)

```javascript
// In MongoDB
db.licenses.insertOne({
  licenseKey: "ck_test_dev_12345",
  customerId: "test_cust_001",
  email: "test@example.com",
  tier: "pro",
  status: "active",
  expiresAt: new Date("2027-12-31"),
  maxDeployments: 3,
  currentDeployments: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Step 10: Update Deploy CLI

Update `packages/deploy-cli/src/services/license.ts`:

```typescript
const LICENSE_API_URL = 'https://YOUR-API-GATEWAY-URL/v1'
```

## Testing

### Test Verify License
```bash
cd lambda-functions
node test/test-verify.js
```

### Test Register Deployment
```bash
node test/test-register.js
```

### Test Webhook
```bash
node test/test-webhook.js
```

## Costs

### AWS Lambda
- First 1M requests: **FREE**
- After: $0.20 per million
- **Expected:** $0/month (under free tier)

### API Gateway
- First 1M requests: **FREE**
- After: $1.00 per million
- **Expected:** $0/month (under free tier)

### MongoDB Atlas
- Using your existing cluster: **$0**

**Total:** **$0/month** for first year (free tier)

## Razorpay Integration

### Plan IDs

Create subscription plans in Razorpay:

```
plan_starter_monthly  → $49/month → tier: "starter" → 1 deployment
plan_pro_monthly      → $149/month → tier: "pro" → 3 deployments  
plan_enterprise_custom → Custom → tier: "enterprise" → 999 deployments
```

### Webhook Events Flow

1. Customer subscribes on whatsnxt.in
2. Razorpay sends `subscription.activated` webhook
3. Lambda creates license → Generates `ck_abc123...`
4. Email sent to customer with license key
5. Customer uses key in `curatekids-deploy`

## Monitoring

### CloudWatch Logs

```bash
# View logs for verify-license
aws logs tail /aws/lambda/curatekids-verify-license --follow

# View logs for register-deployment
aws logs tail /aws/lambda/curatekids-register-deployment --follow

# View logs for webhook
aws logs tail /aws/lambda/curatekids-razorpay-webhook --follow
```

### Metrics

```bash
# Get function invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=curatekids-verify-license \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## Troubleshooting

### "AccessDeniedException"
**Solution:** Check IAM role has correct permissions

### "Unable to import module"
**Solution:** Ensure mongodb is bundled in zip: `zip -r function.zip . node_modules/mongodb`

### "Task timed out"
**Solution:** Increase timeout in Lambda configuration (default 10s is enough)

### "Invalid signature" (webhook)
**Solution:** Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard

## Security

✅ **HTTPS only** - API Gateway enforces SSL  
✅ **Signature verification** - Razorpay webhooks verified  
✅ **Connection reuse** - MongoDB connections cached  
✅ **Secrets in env vars** - No secrets in code  
✅ **IAM authentication** - Lambda role-based access  

## Next Steps

1. Deploy Lambda functions ✅
2. Create API Gateway endpoints ✅
3. Configure Razorpay webhook ✅
4. Test end-to-end ✅
5. Update deploy CLI with API URL ✅
6. Launch! 🚀

---

**Questions?** See `LICENSE_SERVER_SIMPLIFIED.md` for architecture overview.
