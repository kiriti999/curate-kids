#!/bin/bash

# Deploy Lambda Functions to AWS with Function URLs
# No API Gateway needed - each Lambda gets its own HTTPS endpoint

set -e

echo "🚀 Deploying CuratedReels License Server to AWS"
echo "=============================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is required"
    echo "   Install: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    echo "   Run: aws configure"
    exit 1
fi

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}  # N. Virginia
FUNCTION_ROLE=${LAMBDA_ROLE:-""}
MONGODB_URI=${MONGODB_URI:-""}
RAZORPAY_SECRET=${RAZORPAY_WEBHOOK_SECRET:-""}

if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI environment variable not set"
    echo "   export MONGODB_URI='mongodb+srv://...'"
    exit 1
fi

if [ -z "$FUNCTION_ROLE" ]; then
    echo "❌ LAMBDA_ROLE environment variable not set"
    echo "   export LAMBDA_ROLE='arn:aws:iam::123456789:role/lambda-role'"
    exit 1
fi

echo "📋 Configuration:"
echo "   Region: $AWS_REGION"
echo "   MongoDB: ${MONGODB_URI:0:30}..."
echo "   Role: ${FUNCTION_ROLE:(-20)}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install --production --silent

# Function to deploy Lambda
deploy_lambda() {
    local FUNC_NAME=$1
    local FUNC_DIR=$2
    local ENV_VARS=$3
    
    echo ""
    echo "📤 Deploying $FUNC_NAME..."
    
    # Prepare build directory
    BUILD_DIR="/tmp/lambda-build/${FUNC_NAME}"
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    
    # Copy function code
    cp -r "$FUNC_DIR/"* "$BUILD_DIR/"
    
    # Copy shared code
    mkdir -p "$BUILD_DIR/shared"
    cp -r shared/* "$BUILD_DIR/shared/"
    
    # Copy dependencies
    cp -r node_modules "$BUILD_DIR/"
    
    # Create zip from build directory
    cd "$BUILD_DIR"
    zip -q -r "${PWD}/../../${FUNC_NAME}.zip" . -x "*.git*"
    ZIP_PATH="${PWD}/../../${FUNC_NAME}.zip"
    cd - > /dev/null
    
    # Create or update function
    aws lambda create-function \
        --region "$AWS_REGION" \
        --function-name "$FUNC_NAME" \
        --runtime nodejs18.x \
        --role "$FUNCTION_ROLE" \
        --handler index.handler \
        --zip-file "fileb://$ZIP_PATH" \
        --timeout 10 \
        --memory-size 256 \
        --environment "Variables={$ENV_VARS}" \
        2>/dev/null || \
    (
        aws lambda update-function-code \
            --region "$AWS_REGION" \
            --function-name "$FUNC_NAME" \
            --zip-file "fileb://$ZIP_PATH" > /dev/null
        
        aws lambda wait function-updated \
            --region "$AWS_REGION" \
            --function-name "$FUNC_NAME" 2>/dev/null || true

        aws lambda update-function-configuration \
            --region "$AWS_REGION" \
            --function-name "$FUNC_NAME" \
            --environment "Variables={$ENV_VARS}" > /dev/null
    )
    
    # Clean up zip
    rm -f "$ZIP_PATH"
    
    # Wait for function to be ready
    aws lambda wait function-updated \
        --region "$AWS_REGION" \
        --function-name "$FUNC_NAME" 2>/dev/null || true
    
    # Create or update Function URL
    echo "🔗 Creating Function URL..."
    aws lambda create-function-url-config \
        --region "$AWS_REGION" \
        --function-name "$FUNC_NAME" \
        --auth-type NONE \
        --cors "AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type" \
        2>/dev/null || \
    aws lambda update-function-url-config \
        --region "$AWS_REGION" \
        --function-name "$FUNC_NAME" \
        --cors "AllowOrigins=*,AllowMethods=POST,AllowHeaders=Content-Type" \
        2>/dev/null
    
    # Add resource-based policy to allow public invocation
    aws lambda add-permission \
        --region "$AWS_REGION" \
        --function-name "$FUNC_NAME" \
        --statement-id FunctionURLAllowPublicAccess \
        --action lambda:InvokeFunctionUrl \
        --principal "*" \
        --function-url-auth-type NONE \
        2>/dev/null || true
    
    # Get Function URL
    FUNC_URL=$(aws lambda get-function-url-config \
        --region "$AWS_REGION" \
        --function-name "$FUNC_NAME" \
        --query 'FunctionUrl' \
        --output text)
    
    echo "✅ $FUNC_NAME deployed"
    echo "   URL: $FUNC_URL"
    
    # Store URL for summary
    eval "${FUNC_NAME//-/_}_URL='$FUNC_URL'"
    
    # Clean up zip
    rm -f "${FUNC_NAME}.zip"
}

# Deploy verify-license
deploy_lambda \
    "curatedreels-verify-license" \
    "verify-license" \
    "MONGODB_URI=$MONGODB_URI"

# Deploy register-deployment
deploy_lambda \
    "curatedreels-register-deployment" \
    "register-deployment" \
    "MONGODB_URI=$MONGODB_URI"

# Deploy razorpay-webhook
deploy_lambda \
    "curatedreels-razorpay-webhook" \
    "razorpay-webhook" \
    "MONGODB_URI=$MONGODB_URI,RAZORPAY_WEBHOOK_SECRET=$RAZORPAY_SECRET"

echo ""
echo "=============================================="
echo "✅ All Lambda functions deployed!"
echo "=============================================="
echo ""
echo "📋 Function URLs:"
echo ""
echo "1. Verify License:"
echo "   $curatedreels_verify_license_URL"
echo ""
echo "2. Register Deployment:"
echo "   $curatedreels_register_deployment_URL"
echo ""
echo "3. Razorpay Webhook:"
echo "   $curatedreels_razorpay_webhook_URL"
echo ""
echo "💡 Next Steps:"
echo ""
echo "1. Update deploy CLI with verify URL:"
echo "   packages/deploy-cli/src/services/license.ts"
echo "   const VERIFY_URL = '$curatedreels_verify_license_URL'"
echo "   const REGISTER_URL = '$curatedreels_register_deployment_URL'"
echo ""
echo "2. Configure Razorpay webhook:"
echo "   Dashboard → Webhooks → Add endpoint"
echo "   URL: $curatedreels_razorpay_webhook_URL"
echo ""
echo "3. Test verification:"
echo "   curl -X POST $curatedreels_verify_license_URL \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"key\": \"test_12345\"}'"
echo ""
echo "🎉 Setup complete!"
echo ""
