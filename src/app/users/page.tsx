import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { UsersTable } from '@/components/users/users-table'
import { NewUserButton } from '@/components/users/new-user-button'

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage system users and their roles</p>
          </div>
          <NewUserButton />
        </div>

        <UsersTable />
      </div>
    </DashboardLayout>
  )
}
