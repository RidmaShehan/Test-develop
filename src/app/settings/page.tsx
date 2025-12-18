import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SettingsDashboard } from '@/components/settings/settings-dashboard'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and system settings</p>
        </div>

        <SettingsDashboard />
      </div>
    </DashboardLayout>
  )
}
