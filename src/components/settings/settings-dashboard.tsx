'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/lib/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Mail,
  Globe,
  Clock,
  Save,
  Monitor,
  Sun,
  Moon,
  Check,
  AlertCircle
} from 'lucide-react'

export function SettingsDashboard() {
  const { 
    theme, 
    setTheme, 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    compactMode, 
    setCompactMode, 
    showAvatars, 
    setShowAvatars 
  } = useTheme()
  
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [settings, setSettings] = useState({
    // Profile Settings
    profile: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      timezone: 'America/New_York',
      language: 'en'
    },
    // Notification Settings
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      taskReminders: true,
      weeklyReports: true,
      seekerUpdates: true,
      systemAlerts: true
    },
    // System Settings
    system: {
      autoSave: true,
      sessionTimeout: 30,
      dataRetention: 365,
      backupFrequency: 'daily'
    }
  })

  useEffect(() => {
    if (user) {
      // Extract first and last name from user.name
      const nameParts = user.name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      setSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          firstName,
          lastName,
          email: user.email || '',
          phone: ''
        }
      }))
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    try {
      // Save notification and system settings to localStorage
      localStorage.setItem('userSettings', JSON.stringify({
        notifications: settings.notifications,
        system: settings.system
      }))
      
      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      })
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.'
      })
      
      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (section: string, key: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.profile.firstName}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.profile.lastName}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.profile.phone}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailNotifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                  <Label htmlFor="emailNotifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsNotifications"
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                  />
                  <Label htmlFor="smsNotifications" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    SMS Notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taskReminders"
                    checked={settings.notifications.taskReminders}
                    onCheckedChange={(checked) => updateSetting('notifications', 'taskReminders', checked)}
                  />
                  <Label htmlFor="taskReminders" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Task Reminders
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weeklyReports"
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReports', checked)}
                  />
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="seekerUpdates"
                    checked={settings.notifications.seekerUpdates}
                    onCheckedChange={(checked) => updateSetting('notifications', 'seekerUpdates', checked)}
                  />
                  <Label htmlFor="seekerUpdates">Seeker Updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="systemAlerts"
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'systemAlerts', checked)}
                  />
                  <Label htmlFor="systemAlerts">System Alerts</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred theme
                  </p>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Layout Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="sidebarCollapsed">Collapse Sidebar</Label>
                      <p className="text-sm text-muted-foreground">
                        Hide sidebar labels to save space
                      </p>
                    </div>
                    <Checkbox
                      id="sidebarCollapsed"
                      checked={sidebarCollapsed}
                      onCheckedChange={setSidebarCollapsed}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="compactMode">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Reduce spacing and padding throughout the interface
                      </p>
                    </div>
                    <Checkbox
                      id="compactMode"
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="showAvatars">Show User Avatars</Label>
                      <p className="text-sm text-muted-foreground">
                        Display user profile pictures where available
                      </p>
                    </div>
                    <Checkbox
                      id="showAvatars"
                      checked={showAvatars}
                      onCheckedChange={setShowAvatars}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoSave"
                    checked={settings.system.autoSave}
                    onCheckedChange={(checked) => updateSetting('system', 'autoSave', checked)}
                  />
                  <Label htmlFor="autoSave">Auto-save Changes</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.system.sessionTimeout}
                    onChange={(e) => updateSetting('system', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={settings.system.dataRetention}
                    onChange={(e) => updateSetting('system', 'dataRetention', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={settings.system.backupFrequency}
                    onValueChange={(value) => updateSetting('system', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="space-y-4">
        {saveMessage && (
          <div className={`flex items-center gap-2 p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveMessage.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
        )}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            className="flex items-center gap-2"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
