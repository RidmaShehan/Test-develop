# S3 Setup for WhatsApp Media Storage

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# AWS S3 Configuration for Media Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

## AWS S3 Setup

1. **Create an S3 Bucket**:
   - Go to AWS S3 Console
   - Create a new bucket with a unique name
   - Set the region (e.g., us-east-1)

2. **Configure Bucket Permissions**:
   - Enable public read access for media files
   - Or use signed URLs for private access

3. **Create IAM User**:
   - Create a new IAM user with programmatic access
   - Attach the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

4. **Get Access Keys**:
   - Download the access key ID and secret access key
   - Add them to your environment variables

## Features

- **Automatic Upload**: Media files are automatically uploaded to S3
- **Unique Filenames**: Prevents conflicts with timestamp + random string
- **Public URLs**: Files are accessible via direct S3 URLs
- **Metadata Storage**: Original filename and upload timestamp stored
- **Error Handling**: Graceful fallback for upload failures

## File Structure

```
S3 Bucket: your-bucket-name
└── whatsapp-media/
    ├── 1695123456789-abc123.jpg
    ├── 1695123456790-def456.mp4
    └── 1695123456791-ghi789.pdf
```

## Usage

Media files uploaded through WhatsApp campaigns will be:
1. Uploaded to S3 bucket
2. Stored with unique filenames
3. Database records include S3 URLs
4. Viewable in message history