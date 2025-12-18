# 🎓 Education CRM System - Comprehensive Technical Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Core Features](#core-features)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Security & Authentication](#security--authentication)
7. [User Management & Roles](#user-management--roles)
8. [Reports & Analytics](#reports--analytics)
9. [WhatsApp Integration](#whatsapp-integration)
10. [File Management & S3](#file-management--s3)
11. [Deployment Guide](#deployment-guide)
12. [Development Setup](#development-setup)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Education CRM System is a comprehensive Customer Relationship Management platform specifically designed for educational institutions. It provides end-to-end management of student inquiries, campaigns, programs, and administrative workflows with advanced reporting and analytics capabilities.

### Key Highlights
- **Multi-role Access Control**: 5 distinct user roles with granular permissions
- **Advanced Analytics**: Real-time reporting with CSV/PDF export capabilities
- **WhatsApp Integration**: Automated messaging and campaign management
- **Geographic Tracking**: IP-based location detection and logging
- **File Management**: S3-based media storage and management
- **Task Management**: Kanban-style task tracking with follow-up automation
- **Campaign Analytics**: Comprehensive marketing campaign performance tracking

---

## 🏗️ Architecture & Technology Stack

### Frontend Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 18 with Shadcn/ui components
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks, Context API
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Drag & Drop**: @dnd-kit for Kanban boards

### Backend Technologies
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: Prisma 6.16.2
- **Authentication**: JWT-based with HTTP-only cookies
- **File Storage**: AWS S3 integration
- **PDF Generation**: jsPDF with auto-table

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript
- **Database Tools**: Prisma Studio, Prisma CLI

---

## 🚀 Core Features

### 1. User Management System
- **Multi-role Architecture**: 5 distinct roles (Administrator, Admin, Developer, Coordinator, Viewer)
- **Granular Permissions**: 43 different permissions across 9 categories
- **Role Assignment**: Dynamic role assignment with permission inheritance
- **User Activity Tracking**: Complete audit trail of user actions

### 2. Student Inquiry Management
- **Comprehensive Forms**: Multi-step inquiry creation with validation
- **Program Selection**: Multiple program preferences per student
- **Follow-up Automation**: Automated task creation and scheduling
- **Geographic Data**: District-based location tracking
- **Contact Management**: Phone, WhatsApp, email, and guardian contacts

### 3. Campaign Management
- **Campaign Types**: Customizable campaign categories with color coding
- **Analytics Integration**: Views, interactions, reach tracking
- **Media Management**: Image upload and S3 storage
- **Soft Delete**: Trash bin system with recovery capabilities
- **Performance Metrics**: Comprehensive campaign performance analysis

### 4. Program & Level Management
- **Hierarchical Structure**: Programs organized by levels
- **Campus Management**: Multi-campus program support
- **Intake Scheduling**: Next intake date tracking
- **Program Analytics**: Student interest and enrollment tracking

### 5. Task Management
- **Kanban Board**: Visual task management with drag-and-drop
- **Status Tracking**: 7 different task statuses
- **Assignment System**: User-based task assignment
- **Follow-up Automation**: Automatic task creation from inquiries
- **Action History**: Complete task lifecycle tracking

### 6. Reports & Analytics
- **Annual Reports**: Comprehensive yearly activity analysis
- **Real-time Monitoring**: Live activity dashboard
- **Export Capabilities**: CSV and PDF export functionality
- **Geographic Analytics**: Location-based activity analysis
- **User Analytics**: Role-based performance metrics
- **Interactive Charts**: Login trends and activity visualization

### 7. WhatsApp Integration
- **Bulk Messaging**: Mass message sending to student lists
- **Media Support**: Image and video message capabilities
- **Delivery Tracking**: Message status and delivery confirmation
- **Campaign Integration**: WhatsApp campaigns with analytics
- **Recipient Management**: Individual message tracking

---

## 🗄️ Database Schema

### Core Models

#### User Model
```prisma
model User {
  id              String               @id @default(cuid())
  clerkId         String?              @unique
  name            String
  email           String               @unique
  password        String?
  role            UserRole
  isActive        Boolean              @default(true)
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  // Relations
  assignedSeekers Assignment[]
  followUpTasks   FollowUpTask[]
  interactions    Interaction[]
  createdSeekers  Seeker[]             @relation("SeekerCreatedBy")
  userRoles       UserRoleAssignment[]
  createdCampaigns Campaign[]          @relation("CampaignCreatedBy")
  createdCampaignTypes CampaignType[]  @relation("CampaignTypeCreatedBy")
  taskActionHistory TaskActionHistory[]
  activityLogs     UserActivityLog[]
  whatsappMessages WhatsAppMessage[]
}
```

#### Seeker (Student) Model
```prisma
model Seeker {
  id                   String          @id @default(cuid())
  fullName             String
  phone                String          @unique
  whatsapp             Boolean         @default(false)
  whatsappNumber       String?
  email                String?
  city                 String?
  ageBand              String?
  guardianPhone        String?
  programInterestId    String?
  marketingSource      String
  campaignId           String?
  preferredContactTime String?
  preferredStatus      Int?
  followUpAgain        Boolean         @default(false)
  followUpDate         String?
  followUpTime         String?
  description          String?
  stage                SeekerStage     @default(NEW)
  consent              Boolean         @default(false)
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt
  
  // Relations
  assignments          Assignment[]
  followUpTasks        FollowUpTask[]
  interactions         Interaction[]
  createdBy            User?           @relation("SeekerCreatedBy")
  programInterest      Program?
  preferredPrograms    SeekerProgram[]
  campaigns            CampaignSeeker[]
  whatsappRecipients  WhatsAppRecipient[]
}
```

#### Campaign Model
```prisma
model Campaign {
  id             String           @id @default(cuid())
  name           String
  description    String?
  type           String
  targetAudience String
  startDate      DateTime
  endDate        DateTime?
  budget         Float?
  reach          Int?
  imageUrl       String?
  status         CampaignStatus   @default(DRAFT)
  isDeleted      Boolean         @default(false)
  deletedAt      DateTime?
  
  // Analytics fields
  views          Int?            @default(0)
  netFollows     Int?            @default(0)
  totalWatchTime Int?            @default(0)
  averageWatchTime Int?          @default(0)
  audienceRetention Json?
  
  // Interaction analytics
  totalInteractions Int?         @default(0)
  reactions        Int?          @default(0)
  comments         Int?          @default(0)
  shares           Int?          @default(0)
  saves            Int?          @default(0)
  linkClicks       Int?          @default(0)
  
  // Traffic and audience data
  trafficSources   Json?
  audienceDemographics Json?
  
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  createdById    String?
  createdBy      User?           @relation("CampaignCreatedBy")
  seekers        CampaignSeeker[]
  campaignType   CampaignType?
}
```

### Enums

#### User Roles
```prisma
enum UserRole {
  ADMINISTRATOR  // Highest level - can delete administrators
  ADMIN          // High level - cannot delete administrators
  DEVELOPER      // Development access - can delete administrators
  COORDINATOR    // Mid level - operational tasks
  VIEWER         // Read-only access
  SYSTEM         // System-level access
}
```

#### Permissions (43 total)
```prisma
enum Permission {
  // User Management (6 permissions)
  CREATE_USER, READ_USER, UPDATE_USER, DELETE_USER
  ASSIGN_ROLE, MANAGE_USER_ROLES
  
  // Role Management (5 permissions)
  CREATE_ROLE, READ_ROLE, UPDATE_ROLE, DELETE_ROLE
  MANAGE_ROLE_PERMISSIONS
  
  // Seeker Management (4 permissions)
  CREATE_SEEKER, READ_SEEKER, UPDATE_SEEKER, DELETE_SEEKER
  
  // Task Management (5 permissions)
  CREATE_TASK, READ_TASK, UPDATE_TASK, DELETE_TASK, ASSIGN_TASK
  
  // Program Management (4 permissions)
  CREATE_PROGRAM, READ_PROGRAM, UPDATE_PROGRAM, DELETE_PROGRAM
  
  // Campaign Management (5 permissions)
  CREATE_CAMPAIGN, READ_CAMPAIGN, UPDATE_CAMPAIGN, DELETE_CAMPAIGN
  MANAGE_CAMPAIGN_ANALYTICS
  
  // Inquiry Management (5 permissions)
  CREATE_INQUIRY, READ_INQUIRY, UPDATE_INQUIRY, DELETE_INQUIRY
  MANAGE_INQUIRY_INTERACTIONS
  
  // Reports & Analytics (3 permissions)
  READ_REPORTS, EXPORT_REPORTS, VIEW_ANALYTICS
  
  // System Settings (3 permissions)
  READ_SETTINGS, UPDATE_SETTINGS, MANAGE_SYSTEM_CONFIG
  
  // Special Permissions (3 permissions)
  DELETE_ADMINISTRATOR, MANAGE_ALL_USERS, SYSTEM_ADMINISTRATION
}
```

---

## 🔌 API Documentation

### Authentication Endpoints
```typescript
POST /api/auth/login
// Login with email and password
// Returns: JWT token, user data, permissions

POST /api/auth/logout
// Logout and clear session
// Returns: Success confirmation

GET /api/auth/me
// Get current user information
// Returns: User data with permissions
```

### User Management Endpoints
```typescript
GET    /api/users
// Get all users with pagination
// Query params: page, limit, search, role

POST   /api/users
// Create new user
// Body: { name, email, password, role }

GET    /api/users/[id]
// Get user by ID
// Returns: User data with roles and permissions

PUT    /api/users/[id]
// Update user information
// Body: { name, email, role, isActive }

DELETE /api/users/[id]
// Delete user (soft delete)
// Returns: Success confirmation
```

### Role Management Endpoints
```typescript
GET    /api/roles
// Get all roles with permissions
// Returns: Roles with permission details

POST   /api/roles
// Create new role
// Body: { name, description, permissions }

GET    /api/roles/[id]
// Get role by ID
// Returns: Role with permissions and user count

PUT    /api/roles/[id]
// Update role
// Body: { name, description, permissions }

DELETE /api/roles/[id]
// Delete role
// Validation: Cannot delete if users are assigned
```

### Campaign Management Endpoints
```typescript
GET    /api/campaigns
// Get all campaigns with filtering
// Query params: status, type, search, page, limit

POST   /api/campaigns
// Create new campaign
// Body: { name, description, type, targetAudience, startDate, endDate, budget }

GET    /api/campaigns/[id]
// Get campaign by ID
// Returns: Campaign with analytics and seekers

PUT    /api/campaigns/[id]
// Update campaign
// Body: Campaign data with analytics

DELETE /api/campaigns/[id]
// Soft delete campaign
// Returns: Success confirmation

GET    /api/campaigns/trash
// Get deleted campaigns
// Returns: Soft-deleted campaigns

PUT    /api/campaigns/[id]/restore
// Restore deleted campaign
// Returns: Restored campaign

DELETE /api/campaigns/[id]/permanent
// Permanently delete campaign
// Returns: Success confirmation
```

### Seeker Management Endpoints
```typescript
GET    /api/seekers
// Get all seekers with filtering
// Query params: stage, search, page, limit

POST   /api/seekers
// Create new seeker
// Body: { fullName, phone, email, marketingSource, programs, followUp }

GET    /api/seekers/[id]
// Get seeker by ID
// Returns: Seeker with interactions and tasks

PUT    /api/seekers/[id]
// Update seeker
// Body: Seeker data with program preferences

DELETE /api/seekers/[id]
// Delete seeker
// Returns: Success confirmation
```

### Reports Endpoints
```typescript
GET    /api/reports/export
// Export reports in CSV or PDF format
// Query params: format=csv|pdf, year, month
// Returns: File download

GET    /api/user-activity
// Get user activity logs
// Query params: userId, activityType, startDate, endDate, page, limit
// Returns: Paginated activity logs

GET    /api/system-settings
// Get system settings
// Returns: System configuration

PUT    /api/system-settings
// Update system settings
// Body: { key, value }
// Requires: Admin permissions
```

### WhatsApp Integration Endpoints
```typescript
POST   /api/whatsapp/send
// Send WhatsApp message to multiple recipients
// Body: { message, mediaType, mediaFile, recipientIds, campaignId }

GET    /api/whatsapp/messages
// Get WhatsApp message history
// Query params: campaignId, status, page, limit
// Returns: Message history with delivery status

GET    /api/whatsapp/recipients/[messageId]
// Get recipients for specific message
// Returns: Recipient list with delivery status
```

---

## 🔐 Security & Authentication

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  permissions: string[]
  iat: number
  exp: number
}
```

### Authentication Flow
1. **Login Request**: User submits credentials
2. **Validation**: Server validates email and password
3. **Token Generation**: JWT token created with user info and permissions
4. **Cookie Storage**: Token stored in HTTP-only cookie
5. **Request Validation**: Subsequent requests validated using token

### Permission Checking
```typescript
// Single permission check
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}

// Multiple permissions (any)
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

// Multiple permissions (all)
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}
```

### API Protection Middleware
```typescript
export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    throw new Error('Authentication required')
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}
```

---

## 👥 User Management & Roles

### Role Hierarchy

#### 1. ADMINISTRATOR (Highest Level)
- **Permissions**: 43 total (all permissions)
- **Special Access**: Can delete other administrators
- **Use Case**: System owners, CTOs, super admins
- **Capabilities**: Full system control, user management, system administration

#### 2. ADMIN (High Level)
- **Permissions**: 42 total (excludes DELETE_ADMINISTRATOR)
- **Special Access**: Cannot delete administrators (safety feature)
- **Use Case**: Department heads, senior managers, IT administrators
- **Capabilities**: Full system management, user management, reports access

#### 3. DEVELOPER (High Level)
- **Permissions**: 43 total (same as administrator)
- **Special Access**: Can delete administrators (for development needs)
- **Use Case**: Development team, system developers, technical leads
- **Capabilities**: Full system access for testing and development

#### 4. COORDINATOR (Mid Level)
- **Permissions**: 20 total (focused on operational tasks)
- **Use Case**: Team coordinators, operational staff, project managers
- **Capabilities**: Manage inquiries, create tasks, basic user management

#### 5. VIEWER (Lowest Level)
- **Permissions**: 8 total (read-only access)
- **Use Case**: Stakeholders, external users, auditors
- **Capabilities**: View all system data, access reports

### Permission Categories

#### User Management (6 permissions)
- `CREATE_USER`: Create new users
- `READ_USER`: View user information
- `UPDATE_USER`: Modify user details
- `DELETE_USER`: Remove users
- `ASSIGN_ROLE`: Assign roles to users
- `MANAGE_USER_ROLES`: Manage role assignments

#### Role Management (5 permissions)
- `CREATE_ROLE`: Create new roles
- `READ_ROLE`: View role information
- `UPDATE_ROLE`: Modify role settings
- `DELETE_ROLE`: Remove roles
- `MANAGE_ROLE_PERMISSIONS`: Assign permissions to roles

#### Seeker Management (4 permissions)
- `CREATE_SEEKER`: Add new seekers
- `READ_SEEKER`: View seeker information
- `UPDATE_SEEKER`: Modify seeker details
- `DELETE_SEEKER`: Remove seekers

#### Task Management (5 permissions)
- `CREATE_TASK`: Create new tasks
- `READ_TASK`: View task information
- `UPDATE_TASK`: Modify task details
- `DELETE_TASK`: Remove tasks
- `ASSIGN_TASK`: Assign tasks to users

#### Program Management (4 permissions)
- `CREATE_PROGRAM`: Create new programs
- `READ_PROGRAM`: View program information
- `UPDATE_PROGRAM`: Modify program settings
- `DELETE_PROGRAM`: Remove programs

#### Campaign Management (5 permissions)
- `CREATE_CAMPAIGN`: Create new campaigns
- `READ_CAMPAIGN`: View campaign information
- `UPDATE_CAMPAIGN`: Modify campaign settings
- `DELETE_CAMPAIGN`: Remove campaigns
- `MANAGE_CAMPAIGN_ANALYTICS`: Access campaign analytics

#### Inquiry Management (5 permissions)
- `CREATE_INQUIRY`: Create new inquiries
- `READ_INQUIRY`: View inquiry information
- `UPDATE_INQUIRY`: Modify inquiry details
- `DELETE_INQUIRY`: Remove inquiries
- `MANAGE_INQUIRY_INTERACTIONS`: Manage interactions

#### Reports & Analytics (3 permissions)
- `READ_REPORTS`: View system reports
- `EXPORT_REPORTS`: Export reports
- `VIEW_ANALYTICS`: Access analytics

#### System Settings (3 permissions)
- `READ_SETTINGS`: View system configuration
- `UPDATE_SETTINGS`: Modify system settings
- `MANAGE_SYSTEM_CONFIG`: Manage advanced configuration

#### Special Permissions (3 permissions)
- `DELETE_ADMINISTRATOR`: Delete administrator users
- `MANAGE_ALL_USERS`: Manage all users
- `SYSTEM_ADMINISTRATION`: Full system administration

---

## 📊 Reports & Analytics

### Activity Logging System
- **User Login/Logout Tracking**: Automatic logging of all authentication events
- **Geographic Tracking**: IP-based location detection and logging
- **Device Information**: Browser, OS, and device type tracking
- **Session Management**: Complete session lifecycle tracking
- **Security Monitoring**: Failed login attempt tracking

### Report Generation Features
- **Annual Reports**: Comprehensive yearly activity analysis
- **Monthly Filtering**: Detailed monthly breakdowns
- **Export Capabilities**: CSV and PDF export functionality
- **Visual Analytics**: Interactive charts and trend analysis
- **Role-based Access**: Admin-only report access

### Key Metrics Tracked
- **Total Logins/Logouts**: Complete activity counts
- **Unique Users**: Distinct user activity
- **Success Rates**: Login success percentages
- **Geographic Distribution**: Activity by location
- **Device Analysis**: Browser and OS usage patterns
- **Time Analysis**: Hourly activity patterns

### Export Formats

#### CSV Export
- **18 Data Columns**: Comprehensive data export
- **Format**: `annual-report-YYYY-MM.csv`
- **Compatibility**: Excel, Google Sheets, etc.
- **Data Includes**: Timestamp, user info, activity type, location, device info

#### PDF Export
- **Professional Format**: Multi-page report with tables
- **Format**: `annual-report-YYYY-MM.pdf`
- **Sections**: Executive summary, activity breakdown, user analysis, geographic analysis
- **Visual Elements**: Charts, tables, and statistical analysis

### Report Access
- **Admin Only**: Reports accessible to ADMIN and ADMINISTRATOR roles
- **Real-time Data**: Live activity monitoring
- **Filtering Options**: By year, month, user, activity type
- **Interactive Charts**: Login trends with hover effects

---

## 📱 WhatsApp Integration

### Message Management
- **Bulk Messaging**: Send messages to multiple recipients
- **Media Support**: Image and video message capabilities
- **Delivery Tracking**: Message status and delivery confirmation
- **Campaign Integration**: WhatsApp campaigns with analytics
- **Recipient Management**: Individual message tracking

### Message Status Tracking
```typescript
enum WhatsAppStatus {
  PENDING    // Message queued for sending
  SENT       // Message sent successfully
  FAILED     // Message failed to send
  DELIVERED  // Message delivered to recipient
  READ       // Message read by recipient
}
```

### Campaign Integration
- **Recipient Selection**: Choose from campaign participants
- **Message Templates**: Pre-defined message templates
- **Analytics Integration**: Track message performance
- **Delivery Reports**: Comprehensive delivery statistics

### Media Management
- **File Upload**: Support for images and videos
- **S3 Storage**: Secure cloud storage for media files
- **Compression**: Automatic image compression for optimization
- **Format Support**: JPG, PNG, MP4, and other common formats

---

## 📁 File Management & S3

### AWS S3 Integration
- **Secure Storage**: Encrypted file storage in AWS S3
- **Presigned URLs**: Secure file access without exposing credentials
- **Media Optimization**: Automatic image compression and optimization
- **File Organization**: Structured folder hierarchy for different file types

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Videos**: MP4, AVI, MOV
- **Documents**: PDF, DOC, DOCX
- **WhatsApp Media**: Optimized for messaging platforms

### File Upload Process
1. **Client Upload**: File selected and validated
2. **Compression**: Automatic optimization for web delivery
3. **S3 Upload**: Secure upload to AWS S3 bucket
4. **URL Generation**: Presigned URL for secure access
5. **Database Storage**: File metadata stored in database

### Security Features
- **Access Control**: Role-based file access permissions
- **Encryption**: Files encrypted at rest in S3
- **Expiration**: Temporary URLs with automatic expiration
- **Audit Trail**: Complete file access logging

---

## 🚀 Deployment Guide

### Environment Setup

#### Required Environment Variables
```bash
# Database
DATABASE_URL="file:./dev.db"  # Development
DATABASE_URL="postgresql://..."  # Production

# Authentication
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="your-region"
AWS_S3_BUCKET="your-bucket-name"

# Optional: Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Optional: External APIs
GEOLOCATION_API_KEY="your-api-key"
```

### Production Deployment

#### 1. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed initial data
npx tsx scripts/seed-roles-and-permissions.ts
npx tsx scripts/seed-system-settings.ts
```

#### 2. Build and Start
```bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
```

#### 3. Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Migration
```bash
# Development (SQLite)
npx prisma db push

# Production (PostgreSQL)
npx prisma migrate deploy
```

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd CRM-System
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed roles and permissions
npx tsx scripts/seed-roles-and-permissions.ts
npx tsx scripts/seed-system-settings.ts
```

#### 4. Start Development Server
```bash
npm run dev
```

#### 5. Access Application
- Open http://localhost:3000
- Login with admin credentials:
  - Email: `admin@example.com`
  - Password: `admin123`

### Development Scripts
```bash
# Development
npm run dev

# Database operations
npx prisma generate
npx prisma db push
npx prisma studio

# Seeding
npx tsx scripts/seed-roles-and-permissions.ts
npx tsx scripts/seed-system-settings.ts

# Linting and formatting
npm run lint
npm run type-check
```

### Code Quality Tools
- **ESLint**: Code linting with Next.js configuration
- **TypeScript**: Static type checking
- **Prettier**: Code formatting (if configured)
- **Prisma**: Database schema validation

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database file permissions
ls -la prisma/dev.db

# Regenerate Prisma client
npx prisma generate

# Reset database
rm prisma/dev.db
npx prisma db push
```

#### 2. Permission Errors
- **Check User Role**: Verify user has appropriate permissions
- **Role Assignment**: Ensure roles are properly assigned
- **Permission Validation**: Check if specific permission is granted

#### 3. File Upload Issues
- **S3 Configuration**: Verify AWS credentials and bucket permissions
- **File Size**: Check file size limits
- **Format Support**: Ensure file format is supported

#### 4. Report Generation Errors
```bash
# Check if required packages are installed
npm list jspdf jspdf-autotable

# Verify database connectivity
npm run db:status
```

#### 5. WhatsApp Integration Issues
- **API Configuration**: Verify WhatsApp API credentials
- **Message Limits**: Check daily message limits
- **Recipient Validation**: Ensure phone numbers are valid

### Debug Mode
```typescript
// Enable debug logging
console.log('User permissions:', userPermissions)
console.log('Database connection:', prisma.$connect())
console.log('S3 configuration:', s3Config)
```

### Performance Optimization
- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Caching**: Implement Redis for session and permission caching
- **Pagination**: Use pagination for large datasets
- **Image Optimization**: Compress images before upload
- **Lazy Loading**: Load components and data on demand

---

## 📚 Additional Resources

### Documentation Files
- [User Guide](./USER_GUIDE.md) - Complete user documentation
- [Technical Docs](./TECHNICAL_DOCS.md) - Developer documentation
- [Reports Setup](./REPORTS_SETUP.md) - Reports system setup guide
- [S3 Setup](./S3_SETUP.md) - File storage configuration

### Support and Maintenance
- **Error Tracking**: Implement error tracking (Sentry recommended)
- **Performance Monitoring**: Monitor API response times
- **Usage Analytics**: Track user behavior and system usage
- **Backup Strategy**: Regular database backups
- **Security Updates**: Keep dependencies updated

### System Requirements
- **Minimum RAM**: 2GB
- **Recommended RAM**: 4GB+
- **Storage**: 10GB+ for database and files
- **Network**: Stable internet connection for S3 and external APIs

---

## 🎉 Success Metrics

### Implementation Checklist
- ✅ Multi-role authentication system
- ✅ Comprehensive user management
- ✅ Student inquiry management
- ✅ Campaign management with analytics
- ✅ Task management with Kanban board
- ✅ Reports and analytics system
- ✅ WhatsApp integration
- ✅ File management with S3
- ✅ Activity logging and monitoring
- ✅ Mobile responsive design

### Performance Benchmarks
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **File Upload Time**: < 5 seconds (1MB file)
- **Report Generation**: < 10 seconds

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Education CRM Development Team  
**License**: Private/Proprietary
