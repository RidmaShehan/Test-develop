#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 WhatsApp Media Storage Setup')
console.log('================================')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
const envExists = fs.existsSync(envPath)

if (!envExists) {
  console.log('📝 Creating .env.local file...')
  
  const envContent = `# WhatsApp Media Storage Configuration
# Choose one storage method:

# Option 1: AWS S3 (Recommended for production)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_access_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_key_here
# AWS_S3_BUCKET_NAME=your-bucket-name-here

# Option 2: Local Storage (Fallback)
# Files will be stored in public/uploads/whatsapp-media/
# No additional configuration needed

# Ultramsg API Configuration
ULTRAMSG_API_URL=https://api.ultramsg.com/instance104497
ULTRAMSG_TOKEN=8yk46hlsn78dbubl
`

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Created .env.local file')
} else {
  console.log('✅ .env.local file already exists')
}

// Create upload directory
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp-media')
if (!fs.existsSync(uploadDir)) {
  console.log('📁 Creating upload directory...')
  fs.mkdirSync(uploadDir, { recursive: true })
  console.log('✅ Created upload directory:', uploadDir)
} else {
  console.log('✅ Upload directory already exists')
}

console.log('\n🎯 Next Steps:')
console.log('1. For S3 storage: Configure AWS credentials in .env.local')
console.log('2. For local storage: No additional setup needed')
console.log('3. Restart your development server')
console.log('\n📚 See S3_SETUP.md for detailed S3 configuration instructions')
