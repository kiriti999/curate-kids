# CuratedReels Admin CLI

License management CLI for CuratedReels white-label platform. **Company use only.**

## Installation

```bash
npm install -g curatedreels-admin
# or run directly
npx curatedreels-admin
```

## Setup

Set the company MongoDB URI:

```bash
export MONGODB_URI="mongodb+srv://..."
```

## Commands

### Create License

```bash
curatedreels-admin create --name "Acme Corp" --email "admin@acme.com" --tier pro

# Options:
#   --name, -n     Customer name (required)
#   --email, -e    Customer email (required)
#   --tier, -t     License tier: starter, pro, enterprise (default: starter)
#   --expires      Expiration date (ISO format, optional)
```

**Tiers:**
- `starter` - 1 deployment
- `pro` - 5 deployments
- `enterprise` - 999 deployments

### List Licenses

```bash
curatedreels-admin list

# Options:
#   --status, -s   Filter by status: active, revoked, expired
#   --tier, -t     Filter by tier
```

### License Info

```bash
curatedreels-admin info <license-key>
```

### Verify License

```bash
curatedreels-admin verify <license-key>
```

### Revoke License

```bash
curatedreels-admin revoke <license-key>
```

### View Deployments

```bash
curatedreels-admin deployments <license-key>
```

### Statistics

```bash
curatedreels-admin stats
```

## License Key Format

- Production: `ck_live_<32-char-id>`
- Test: `ck_test_<32-char-id>`

## MongoDB Schema

**licenses collection:**
```javascript
{
  key: String,
  customerId: String,
  customerName: String,
  customerEmail: String,
  tier: "starter" | "pro" | "enterprise",
  status: "active" | "revoked" | "expired",
  maxDeployments: Number,
  createdAt: Date,
  expiresAt: Date | null
}
```

**deployments collection:**
```javascript
{
  licenseKey: String,
  projectName: String,
  frontendUrl: String,
  cmsUrl: String,
  botUrl: String,
  deployedAt: Date,
  status: "active" | "deleted"
}
```

## Example Workflow

```bash
# 1. Create a license for new customer
curatedreels-admin create -n "Acme Corp" -e "billing@acme.com" -t pro
# Output: License created: ck_live_abc123...

# 2. Send the key to customer - they use it with:
npx curatedreels-deploy

# 3. Monitor deployments
curatedreels-admin deployments ck_live_abc123...

# 4. View overall stats
curatedreels-admin stats

# 5. Revoke if needed
curatedreels-admin revoke ck_live_abc123...

pnpm run license:create -n "Name" -e "email" -t starter
pnpm run license:list
pnpm run license:stats
```

## Security

- Keep `MONGODB_URI` secret - it grants full license management access
- Only company administrators should have access to this CLI
- Customers only receive license keys, never database credentials
