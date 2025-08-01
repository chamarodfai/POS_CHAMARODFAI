# Deploy Script for POS System
# สคริปต์สำหรับ deploy และตรวจสอบระบบ

echo "🚀 Starting POS System Deployment Process..."

# ตรวจสอบ Environment Variables
echo "📋 Checking Environment Variables..."

if [ -z "$REACT_APP_SUPABASE_URL" ]; then
    echo "❌ REACT_APP_SUPABASE_URL is not set"
    echo "💡 Set it in Vercel Dashboard > Settings > Environment Variables"
    exit 1
fi

if [ -z "$REACT_APP_SUPABASE_ANON_KEY" ]; then
    echo "❌ REACT_APP_SUPABASE_ANON_KEY is not set"
    echo "💡 Set it in Vercel Dashboard > Settings > Environment Variables"  
    exit 1
fi

echo "✅ Environment Variables OK"
echo "📦 REACT_APP_SUPABASE_URL: ${REACT_APP_SUPABASE_URL:0:30}..."
echo "🔑 REACT_APP_SUPABASE_ANON_KEY: ${REACT_APP_SUPABASE_ANON_KEY:0:30}..."

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo "🎉 Deployment process completed successfully!"
echo "🌐 Your POS System should be available at your Vercel URL"
echo ""
echo "📝 Next Steps:"
echo "1. Visit your deployed site"
echo "2. Check the Supabase connection indicator"
echo "3. Set up your database schema if not done yet"
echo "4. Test all features"
