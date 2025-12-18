# CRM System - User Guide

## 🔐 Login Credentials

### Default Admin User
```
Email: admin@example.com
Password: password
Role: ADMIN
```

### Additional Working Users
```
Email: john.admin@company.com
Password: admin123
Role: ADMINISTRATOR (Highest Level)
```

### Test Users (Create these for testing)
```
Email: coordinator@example.com
Password: coordinator123
Role: COORDINATOR

Email: viewer@example.com
Password: viewer123
Role: VIEWER
```

## 👥 Role System Explained

### ADMINISTRATOR (Highest Level)
**What they can do:**
- Delete other administrators
- Full system control
- Manage all users and roles
- Access all system settings
- Perform any action in the system

**Permissions:** 43 total permissions (everything)
**Use case:** System owners, CTOs, super admins

### ADMIN (High Level)
**What they can do:**
- Full system management
- Cannot delete administrators (safety feature)
- Manage all users and roles
- Access all system settings
- Perform most actions in the system

**Permissions:** 42 total permissions (excludes DELETE_ADMINISTRATOR)
**Use case:** Department heads, senior managers, IT administrators

### DEVELOPER (High Level)
**What they can do:**
- Same as administrator for development
- Can delete administrators (for development needs)
- Full system access for testing and development
- Access to all features and settings

**Permissions:** 43 total permissions (same as administrator)
**Use case:** Development team, system developers, technical leads

### COORDINATOR (Mid Level)
**What they can do:**
- Manage inquiries and interactions
- Create and assign tasks
- Basic user management (read/update)
- View programs and campaigns
- Access to reports and analytics

**Permissions:** 20 total permissions (focused on operational tasks)
**Use case:** Team coordinators, operational staff, project managers

### VIEWER (Lowest Level)
**What they can do:**
- View all system data
- Access reports and analytics
- Cannot modify any data
- Limited to viewing permissions

**Permissions:** 8 total permissions (read-only access)
**Use case:** Stakeholders, external users, auditors

## 🔑 Permission Categories Explained

### User Management (6 permissions)
- **CREATE_USER**: Create new users in the system
- **READ_USER**: View user information and profiles
- **UPDATE_USER**: Modify user details and settings
- **DELETE_USER**: Remove users from the system
- **ASSIGN_ROLE**: Assign roles to users
- **MANAGE_USER_ROLES**: Manage user role assignments

### Role Management (5 permissions)
- **CREATE_ROLE**: Create new roles in the system
- **READ_ROLE**: View role information and details
- **UPDATE_ROLE**: Modify role settings and permissions
- **DELETE_ROLE**: Remove roles from the system
- **MANAGE_ROLE_PERMISSIONS**: Assign permissions to roles

### Seeker Management (4 permissions)
- **CREATE_SEEKER**: Add new seekers to the system
- **READ_SEEKER**: View seeker information and profiles
- **UPDATE_SEEKER**: Modify seeker details and information
- **DELETE_SEEKER**: Remove seekers from the system

### Task Management (5 permissions)
- **CREATE_TASK**: Create new tasks and assignments
- **READ_TASK**: View task information and details
- **UPDATE_TASK**: Modify task details and status
- **DELETE_TASK**: Remove tasks from the system
- **ASSIGN_TASK**: Assign tasks to team members

### Program Management (4 permissions)
- **CREATE_PROGRAM**: Create new programs and courses
- **READ_PROGRAM**: View program information and details
- **UPDATE_PROGRAM**: Modify program settings and content
- **DELETE_PROGRAM**: Remove programs from the system

### Campaign Management (5 permissions)
- **CREATE_CAMPAIGN**: Create new marketing campaigns
- **READ_CAMPAIGN**: View campaign information and details
- **UPDATE_CAMPAIGN**: Modify campaign settings and content
- **DELETE_CAMPAIGN**: Remove campaigns from the system
- **MANAGE_CAMPAIGN_ANALYTICS**: Access and manage campaign analytics

### Inquiry Management (5 permissions)
- **CREATE_INQUIRY**: Create new inquiries and leads
- **READ_INQUIRY**: View inquiry information and details
- **UPDATE_INQUIRY**: Modify inquiry details and status
- **DELETE_INQUIRY**: Remove inquiries from the system
- **MANAGE_INQUIRY_INTERACTIONS**: Manage inquiry interactions and follow-ups

### Reports & Analytics (3 permissions)
- **READ_REPORTS**: View system reports and data
- **EXPORT_REPORTS**: Export reports in various formats
- **VIEW_ANALYTICS**: Access analytics and performance data

### System Settings (3 permissions)
- **READ_SETTINGS**: View system configuration and settings
- **UPDATE_SETTINGS**: Modify system settings and configuration
- **MANAGE_SYSTEM_CONFIG**: Manage advanced system configuration

### Special Permissions (3 permissions)
- **DELETE_ADMINISTRATOR**: Delete administrator users (ADMINISTRATOR & DEVELOPER only)
- **MANAGE_ALL_USERS**: Manage all users in the system
- **SYSTEM_ADMINISTRATION**: Full system administration access

## 🚀 Getting Started

### Step 1: Installation
```bash
# Clone the repository
git clone <repository-url>
cd CRM-System

# Install dependencies
npm install
```

### Step 2: Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed roles and permissions
npx tsx scripts/seed-roles-and-permissions.ts
```

### Step 3: Start the Application
```bash
# Start development server
npm run dev

# Access the application
# Open http://localhost:3000
```

### Step 4: Login
- Use the admin credentials: `admin@example.com` / `admin123`
- Navigate to User Management to create additional users
- Assign appropriate roles to new users

## 🎯 How to Use the System

### Creating Users
1. Go to **User Management** → **Users**
2. Click **"New User"**
3. Fill in user details
4. Assign a role
5. Save the user

### Managing Roles
1. Go to **User Management** → **Roles & Permissions**
2. Click **"Create Role"** to add new roles
3. Select permissions for the role
4. Save the role

### Assigning Roles
1. Go to **User Management** → **Users**
2. Find the user you want to modify
3. Click **"Change Role"**
4. Select the new role
5. Confirm the assignment

### Campaign Management
1. Go to **Campaigns**
2. Click **"New Campaign"** to create campaigns
3. Use **"Edit"** to modify existing campaigns
4. Access **"Analytics"** for performance data
5. Use **"Trash Bin"** to manage deleted campaigns

## 🔒 Security Features

### Role Hierarchy Protection
- **ADMINISTRATOR**: Can delete other administrators
- **ADMIN**: Cannot delete administrators (safety feature)
- **DEVELOPER**: Full access for development (can delete administrators)
- **COORDINATOR**: Limited operational access
- **VIEWER**: Read-only access

### Permission Validation
- All actions are validated against user permissions
- Server-side permission enforcement
- UI adapts based on user permissions

### Data Safety
- Role deletion protection (cannot delete roles with assigned users)
- Permission inheritance (users inherit permissions from their roles)
- Audit trail (role changes are tracked and logged)

## 📊 System Features

### User Management
- Create, read, update, delete users
- Assign roles to users
- Manage user status (active/inactive)
- Bulk user operations

### Role Management
- Create, read, update, delete roles
- Assign permissions to roles
- Role hierarchy management
- Permission matrix visualization

### Campaign Management
- Full campaign lifecycle management
- Analytics integration
- Reach tracking
- Trash bin system with recovery

### Task Management
- Task creation and assignment
- Status tracking
- User assignment
- Priority management

### Reports & Analytics
- Campaign performance metrics
- User activity reports
- Export functionality
- Real-time data

## 🆘 Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user role and permissions
   - Verify role assignments
   - Contact administrator for role changes

2. **Database Connection Issues**
   - Run `npx prisma generate`
   - Run `npx prisma db push`
   - Check database file permissions

3. **Role Management Issues**
   - Ensure roles are properly seeded
   - Check permission assignments
   - Verify user role assignments

### Getting Help
- Check system logs for error details
- Verify user permissions and role assignments
- Contact the system administrator

---

**Last Updated**: December 2024  
**Version**: 1.0.0
