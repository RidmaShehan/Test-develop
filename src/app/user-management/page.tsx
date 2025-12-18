import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { UserManagementDashboard } from '@/components/user-management/user-management-dashboard'
import { RoleManagementDashboard } from '@/components/user-management/role-management-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function UserManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions across the system</p>
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
