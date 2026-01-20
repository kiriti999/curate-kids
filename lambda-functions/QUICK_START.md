# Deploy in 10 Minutes - Lambda Function URLs

**No API Gateway needed!** Each Lambda gets its own HTTPS URL automatically.

## Quick Deploy

### Step 1: Configure AWS (2 minutes)

```bash
# If not done already
aws configure
# Enter: Access Key, Secret, Region: ap-south-1
```

### Step 2: Create IAM Role (1 minute)

```bash
# Create role
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

# Attach permissions
aws iam attach-role-policy \
  --role-name curatekids-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get ARN (copy this!)
aws iam get-role --role-name curatekids-lambda-role --query 'Role.Arn' --output text
```

### Step 3: Set Environment Variables (1 minute)

```bash
export MONGODB_URI='your-mongodb-connection-string'
export LAMBDA_ROLE='arn:aws:iam::123456789:role/curatekids-lambda-role'  # from step 2
export RAZORPAY_WEBHOOK_SECRET='your-razorpay-webhook-secret'  # optional for now
```

### Step 4: Deploy (5 minutes)

```bash
cd lambda-functions
chmod +x deploy.sh
./deploy.sh
```

**Output:**
```
✅ All Lambda functions deployed!

📋 Function URLs:

1. Verify License:
   https://abc123xyz.lambda-url.ap-south-1.on.aws

2. Register Deployment:
   https://def456xyz.lambda-url.ap-south-1.on.aws

3. Razorpay Webhook:
   https://ghi789xyz.lambda-url.ap-south-1.on.aws
```

### Step 5: Update Deploy CLI (1 minute)

Edit `packages/deploy-cli/src/services/license.ts`:

```typescript
const VERIFY_URL = 'https://abc123xyz.lambda-url.ap-south-1.on.aws'  // paste from step 4
const REGISTER_URL = 'https://def456xyz.lambda-url.ap-south-1.on.aws'  // paste from step 4
```

### Step 6: Test (1 minute)

```bash
# Create test license in MongoDB
mongosh "your-connection-string"

use curatekids-licenses

db.licenses.insertOne({
  licenseKey: "ck_test_12345",
  tier: "pro",
  status: "active",
  expiresAt: new Date("2027-12-31"),
  maxDeployments: 3,
  currentDeployments: 0,
  email: "test@example.com",
  customerId: "test_001",
  createdAt: new Date()
})

# Test the endpoint
curl -X POST https://abc123xyz.lambda-url.ap-south-1.on.aws \
  -H "Content-Type: application/json" \
  -d '{"key": "ck_test_12345"}'

# Expected response:
# {"valid": true, "tier": "pro", ...}
```

## Done! ✅

**Total Time:** ~10 minutes  
**Cost:** $0 (Lambda Function URLs are completely free)  
**No API Gateway needed!**

## Next Steps

### Configure Razorpay Webhook

1. Go to Razorpay Dashboard → Webhooks
2. Add endpoint URL: `https://ghi789xyz.lambda-url.ap-south-1.on.aws` (from step 4)
3. Select events: `subscription.*`
4. Save webhook secret
5. Update Lambda environment variable:
   ```bash
   aws lambda update-function-configuration \
     --function-name curatekids-razorpay-webhook \
     --environment "Variables={MONGODB_URI=$MONGODB_URI,RAZORPAY_WEBHOOK_SECRET=your-secret}"
   ```

### Test Full Flow

```bash
cd packages/deploy-cli
npm install
npm run dev

# Enter license: ck_test_12345
# Should proceed with deployment!
```

## Troubleshooting

### "AccessDeniedException"
**Fix:** Check LAMBDA_ROLE is correct

### "FunctionUrlConfig already exists"
**Fix:** This is fine - it's updating existing config

### "Unable to import module"
**Fix:** Re-run ./deploy.sh

### Test returns 403
**Fix:** Wait 30 seconds for permissions to propagate

## Update Later

If you want to change URLs without redeploying:

```bash
# Get current URLs
aws lambda get-function-url-config \
  --function-name curatekids-verify-license \
  --query 'FunctionUrl'
```

---

**That's it!** No API Gateway, no complex setup. Just 3 HTTPS URLs that work forever.
