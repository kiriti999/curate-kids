# CuratedReels Integration Status

I have successfully integrated CuratedReels payment flow into the `whatsnxt` ecosystem.

## Backend Changes (`whatsnxt-bff`)
1.  **Service**: Added `createLicenseOrder` to `PaymentGatewayService`.
2.  **Controller**: Created `CurateKidsController` to handle order creation.
3.  **Routes**: Added `/api/v1/curatedreels/orders` endpoint.

## Frontend Changes (`whatsnxt-mfe`)
1.  **Page**: Created `apps/web/app/curatedreels/pricing` page.
    - Displays 3 tiers: Starter, Pro, Enterprise.
    - Handles "Buy Now" flow with Razorpay.
    - Captures user Name & Email for the license.

## How it Works
1.  User goes to `/curatedreels/pricing` on whatsnxt website.
2.  Selects a plan → Enter details → "Proceed to Payment".
3.  Frontend calls `POST /api/v1/curatedreels/orders`.
4.  Backend creates Razorpay order with `notes: { type: 'curatekids_license', tier: '...' }`.
5.  User pays via Razorpay.
6.  **Razorpay sends Webhook (`payment.captured`) to your Lambda URL.**
7.  Lambda generates license and sends email.

## Required One-Time Setup
**You MUST configure the Razorpay Webhook for the Lambda Function:**

1.  Log in to Razorpay Dashboard.
2.  Go to Settings > Webhooks.
3.  Add New Webhook:
    - **Webhook URL**: `https://nk3yd6cab52l2d2ats3xe4ydda0pfmqh.lambda-url.ap-south-1.on.aws/`
    - **Active Events**: `payment.captured`
    - **Secret**: `temp_secret` (or whatever you set in Lambda env)

This ensures the license is actually generated after payment!
