# CRM System - Technical Documentation

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: Custom JWT-based authentication
- **UI Components**: Shadcn/ui, Tailwind CSS
- **State Management**: React hooks, Context API

### Database Schema

#### User Model
```typescript
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
}
```

#### Role Model
```typescript
model Role {
  id          String               @id @default(cuid())
  name        String               @unique
  description String?
  isActive    Boolean              @default(true)
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
  permissions RolePermission[]
  users       UserRoleAssignment[]
}
```

#### Permission Model
```typescript
model PermissionModel {
  id          String           @id @default(cuid())
  name        Permission       @unique
  description String?
  createdAt   DateTime         @default(now())
  roles       RolePermission[]
}
```

## 🔐 Authentication System

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
1. User submits credentials
2. Server validates credentials
3. JWT token generated with user info and permissions
4. Token stored in HTTP-only cookie
5. Subsequent requests validated using token

### Permission Checking
```typescript
// Check single permission
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}

// Check multiple permissions (any)
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

// Check multiple permissions (all)
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission))
}
```

## 🎯 API Endpoints

### Authentication Endpoints
```typescript
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### User Management Endpoints
```typescript
GET    /api/users
POST   /api/users
GET    /api/users/[id]
PUT    /api/users/[id]
DELETE /api/users/[id]
```

### Role Management Endpoints
```typescript
GET    /api/roles
POST   /api/roles
GET    /api/roles/[id]
PUT    /api/roles/[id]
DELETE /api/roles/[id]
```

### Campaign Management Endpoints
```typescript
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/[id]
PUT    /api/campaigns/[id]
DELETE /api/campaigns/[id]           // Soft delete
GET    /api/campaigns/trash          // Get deleted campaigns
PUT    /api/campaigns/[id]/restore   // Restore campaign
DELETE /api/campaigns/[id]/permanent // Permanent delete
```

## 🛡️ Security Implementation

### Role-Based Access Control (RBAC)
```typescript
// Role hierarchy
const ROLE_HIERARCHY = {
  ADMINISTRATOR: 1,
  ADMIN: 2,
  DEVELOPER: 3,
  COORDINATOR: 4,
  VIEWER: 5
}

// Permission validation
export function canPerformAction(userPermissions: string[], action: string, resource: string): boolean {
  const permission = `${action.toUpperCase()}_${resource.toUpperCase()}`
  return hasPermission(userPermissions, permission)
}
```

### API Protection
```typescript
// Middleware for API protection
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

### Permission Gates
```typescript
// React component for permission-based rendering
export function PermissionGate({ 
  permissions, 
  children, 
  fallback 
}: PermissionGateProps) {
  const { userPermissions } = usePermissions()
  
  const hasPermission = permissions.some(permission => 
    userPermissions.includes(permission)
  )
  
  return hasPermission ? children : fallback
}
```

## 📊 Database Operations

### Prisma Queries
```typescript
// Get user with roles and permissions
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    }
  }
})

// Get roles with user counts
const roles = await prisma.role.findMany({
  include: {
    permissions: {
      include: {
        permission: true
      }
    },
    users: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      }
    }
  }
})
```

### Soft Delete Implementation
```typescript
// Soft delete campaign
const campaign = await prisma.campaign.update({
  where: { id: campaignId },
  data: {
    isDeleted: true,
    deletedAt: new Date()
  }
})

// Get active campaigns (exclude deleted)
const activeCampaigns = await prisma.campaign.findMany({
  where: {
    isDeleted: false
  }
})

// Get deleted campaigns
const deletedCampaigns = await prisma.campaign.findMany({
  where: {
    isDeleted: true
  }
})
```

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                    # Base UI components
│   ├── layout/               # Layout components
│   ├── user-management/      # User management components
│   ├── campaigns/           # Campaign components
│   └── ...
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
└── app/                     # Next.js app directory
    ├── api/                 # API routes
    ├── (routes)/            # Page components
    └── globals.css          # Global styles
```

### State Management
```typescript
// Custom hook for permissions
export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUserPermissions()
  }, [])
  
  const fetchUserPermissions = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      setUserPermissions(data.permissions || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return { userPermissions, loading }
}
```

## 🚀 Deployment

### Environment Variables
```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"

# Optional: Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
```

### Production Setup
1. **Database**: Switch to PostgreSQL
2. **Environment**: Set production environment variables
3. **Build**: `npm run build`
4. **Start**: `npm start`

### Docker Support
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

## 🔧 Development

### Scripts
```bash
# Development
npm run dev

# Database
npx prisma generate
npx prisma db push
npx prisma studio

# Seeding
npx tsx scripts/seed-roles-and-permissions.ts

# Testing
npm run test
npm run test:watch
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

## 📈 Performance

### Optimization Strategies
1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Caching**: Implement Redis for session and permission caching
3. **Pagination**: Implement pagination for large datasets
4. **Lazy Loading**: Load components and data on demand
5. **Image Optimization**: Use Next.js Image component

### Monitoring
- **Error Tracking**: Implement error tracking (Sentry)
- **Performance**: Monitor API response times
- **Usage Analytics**: Track user behavior and system usage

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
