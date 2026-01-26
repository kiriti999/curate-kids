# Lambda Function URLs vs API Gateway

## TL;DR

✅ **Use Lambda Function URLs** - Simpler, free, perfect for your use case.

## Side-by-Side Comparison

### Lambda Function URLs ✅ (What we're using)

**Setup:**
```bash
./deploy.sh
# Done! 3 URLs created automatically
```

**Result:**
```
https://abc123.lambda-url.ap-south-1.on.aws  → verify-license
https://def456.lambda-url.ap-south-1.on.aws  → register-deployment
https://ghi789.lambda-url.ap-south-1.on.aws  → razorpay-webhook
```

**Pros:**
- ✅ **5 minutes** to set up
- ✅ **Completely FREE** (no limits, ever)
- ✅ **HTTPS included** automatically
- ✅ **CORS built-in** - works from browsers
- ✅ **No configuration** - just enable and go
- ✅ **Direct invocation** - fastest possible
- ✅ **Simple** - one URL per function

**Cons:**
- ❌ 3 separate URLs (not one unified API)
- ❌ No rate limiting built-in
- ❌ No usage analytics dashboard
- ❌ No API keys/authentication layer

**Cost:** **$0** forever

---

### API Gateway (Alternative)

**Setup:**
```bash
# Create REST API
# Create resources (/v1/licenses/verify, etc.)
# Link to Lambda functions
# Configure CORS
# Deploy to stage
# Configure custom domain (optional)
# Test each endpoint
```

**Result:**
```
https://api.curatedreels.com/v1/licenses/verify
https://api.curatedreels.com/v1/deployments
https://api.curatedreels.com/v1/webhook/razorpay
```

**Pros:**
- ✅ **One unified URL** with paths
- ✅ **Rate limiting** per API key
- ✅ **Usage analytics** built-in
- ✅ **API keys** for authentication
- ✅ **Request/response transformation**
- ✅ **Custom domains** easier
- ✅ **Usage plans** and quotas

**Cons:**
- ❌ **30-40 minutes** to set up
- ❌ **Complex configuration** - many steps
- ❌ **Costs money** after 1M requests
- ❌ **Another service** to maintain
- ❌ **Adds latency** (~10-30ms per request)
- ❌ **Overkill** for 3 endpoints

**Cost:** 
- Free tier: First 1M requests/month
- After: $1 per million requests
- ~$1-5/month for typical usage

---

## Your Use Case

**Traffic expected:** ~10,000 requests/month
- 1,000 deployments × 2 API calls = 2,000
- 1,000 license checks = 1,000
- 100 webhook events = 100
- **Total: ~3,000/month**

**With Function URLs:** $0  
**With API Gateway:** $0 (under free tier, but adds complexity)

---

## When to Use API Gateway

Use API Gateway if you need:

1. **Rate limiting per customer**
   - "Starter tier: 100 requests/day"
   - "Pro tier: 1000 requests/day"

2. **API keys for authentication**
   - Instead of license keys in body
   - `X-API-Key: abc123` header

3. **Usage analytics dashboard**
   - See who's calling APIs, how often
   - Track errors per endpoint

4. **Request transformation**
   - Modify requests before hitting Lambda
   - Add/remove headers automatically

5. **Custom domain with SSL**
   - `api.curatedreels.com` instead of AWS URL
   - Automatic SSL certificate management

6. **Caching**
   - Cache GET responses at edge
   - Reduce Lambda invocations

**For your MVP: Function URLs are perfect!**

---

## Migration Path

**Start with Function URLs:**
- Deploy today
- Launch in 10 minutes
- $0 cost
- Works great

**Add API Gateway later if needed:**
- Can wrap Function URLs with API Gateway anytime
- No code changes needed in Lambda
- Just update deploy CLI URLs
- Takes 1 hour to migrate

---

## Real-World Example

### Function URLs (Current)

Customer CLI:
```typescript
fetch('https://abc123.lambda-url.ap-south-1.on.aws', {
  method: 'POST',
  body: JSON.stringify({ key: licenseKey })
})
```

### API Gateway (If you migrate)

Customer CLI:
```typescript
fetch('https://api.curatedreels.com/v1/licenses/verify', {
  method: 'POST',
  headers: { 'X-API-Key': apiKey },  // optional
  body: JSON.stringify({ key: licenseKey })
})
```

Same Lambda function, just different entry point!

---

## Summary

| Aspect | Function URLs | API Gateway |
|--------|---------------|-------------|
| **Setup Time** | 5 min | 40 min |
| **Cost** | FREE | FREE then $$ |
| **Complexity** | Very simple | Medium |
| **For 3 endpoints** | Perfect | Overkill |
| **For 50 endpoints** | Gets messy | Perfect |
| **Rate limiting** | Manual | Built-in |
| **Custom domain** | Manual DNS | Built-in |
| **When to use** | **MVP/Small APIs** | Large APIs |

**Recommendation:** Use Function URLs now, add API Gateway only if you really need it later.

---

**Already deployed with Function URLs!** See `QUICK_START.md` for 10-minute setup.
