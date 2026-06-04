import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const UserManagementDashboard = dynamic(
  () => import('@/components/user-management/user-management-dashboard').then(m => ({ default: m.UserManagementDashboard })),
  { loading: () => <div className="h-96 bg-muted rounded animate-pulse" /> }
)
const RoleManagementDashboard = dynamic(
  () => import('@/components/user-management/role-management-dashboard').then(m => ({ default: m.RoleManagementDashboard })),
  { loading: () => <div className="h-96 bg-muted rounded animate-pulse" /> }
)

export default function UserManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions across the system</p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagementDashboard />
          </TabsContent>
          
          <TabsContent value="roles">
            <RoleManagementDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
