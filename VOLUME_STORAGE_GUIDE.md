# Railway Volume Storage Guide

## Overview
Your ERP system is configured to use Railway's persistent volume mounted at `/data` for storing files, documents, and other persistent data that needs to survive container restarts and deployments.

## Volume Structure

```
/data/
├── uploads/       # General file uploads
├── documents/     # Business documents
├── temp/          # Temporary files
├── cache/         # Cached data
├── reports/       # Generated reports
├── invoices/      # Invoice files
└── attachments/   # Email and document attachments
```

## Features Implemented

### 1. Storage API Endpoints
- `POST /api/storage/upload` - Upload files to volume
- `GET /api/storage/file?path=...` - Retrieve files
- `DELETE /api/storage/delete` - Delete files
- `GET /api/storage/info` - Get storage statistics

### 2. Frontend Components
- **FileUpload Component**: Drag-and-drop file upload with progress
- **Storage Page**: View and manage volume storage
- **useStorage Hook**: Monitor storage usage

### 3. Database Integration
All uploaded files are tracked in the `Document` table with metadata:
- File name, path, size, MIME type
- Upload timestamp and user
- Category and status

## Usage Examples

### Upload a File
```javascript
import { storage } from '@/config/storage'

// Upload a file
const file = new File(['content'], 'document.pdf')
const path = await storage.saveFile(file, 'documents')
console.log('File saved at:', path)
```

### Access Storage Page
Navigate to `/storage` in your ERP to:
- View storage usage and statistics
- Upload new files
- See files organized by category
- Monitor volume capacity

### Direct Volume Access (Backend)
```javascript
// In your API routes
import { readFileSync } from 'fs'
import { join } from 'path'

const VOLUME_PATH = '/data'
const filePath = join(VOLUME_PATH, 'documents', 'file.pdf')
const content = readFileSync(filePath)
```

## Production Benefits

1. **Persistence**: Files survive deployments and restarts
2. **Performance**: Direct file system access is faster than cloud storage
3. **Cost-Effective**: No external storage service fees
4. **Integrated**: Works seamlessly with your ERP

## Storage Limits

- Individual file size: 10MB (configurable)
- Total volume size: Based on your Railway plan
- File types: All types supported

## Security Features

1. **Path Validation**: Prevents directory traversal attacks
2. **Authentication**: All storage endpoints require valid JWT
3. **File Type Validation**: Optional MIME type restrictions
4. **User Tracking**: All uploads linked to authenticated user

## Monitoring

Check storage status:
1. Via UI: Navigate to `/storage`
2. Via API: `GET /api/storage/info`
3. In Railway dashboard: Check volume metrics

## Backup Recommendations

Since Railway volumes are persistent but not backed up by default:

1. **Regular Exports**: Implement scheduled backups to cloud storage
2. **Database Records**: All file metadata is in PostgreSQL (backed up)
3. **Critical Files**: Consider redundant storage for critical documents

## Environment Variables

No additional environment variables needed. The volume is automatically available at `/data` in production.

## Testing Locally

For local development, files are stored in `./data` directory. The system automatically detects the environment:

```javascript
const VOLUME_PATH = process.env.NODE_ENV === 'production' ? '/data' : './data'
```

## Next Steps

1. **Add S3 Backup**: Implement automated backup to S3/cloud storage
2. **File Preview**: Add document preview capabilities
3. **Virus Scanning**: Integrate file scanning for security
4. **Compression**: Auto-compress large files to save space
5. **Thumbnails**: Generate thumbnails for images

## Troubleshooting

### "Permission Denied" Error
Ensure the volume is properly mounted in Railway with write permissions.

### Files Not Persisting
Check that you're writing to `/data` path, not container's local filesystem.

### Storage Full
Monitor usage via `/storage` page and clean up old files or upgrade Railway plan.

### File Not Found
Verify the file path and ensure it starts with a valid category directory.