'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  userRoles: Array<{
    id: string
    role: {
      id: string
      name: string
    }
  }>
}

interface Role {
  id: string
  name: string
  description: string | null
}

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated?: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    selectedRoles: user.userRoles.map(ur => ur.role.id),
  })
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (open) {
      fetchRoles()
    }
  }, [open])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        console.error('Error fetching roles: API returned non-OK status')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords if password fields are shown
    if (showPasswordFields) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      
      if (passwordData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long')
        return
      }
    }
    
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ...(showPasswordFields && { password: passwordData.newPassword }),
        }),
      })

      if (response.ok) {
        toast.success('User updated successfully')
        onUserUpdated?.()
        onOpenChange(false)
        setShowPasswordFields(false)
        setPasswordData({ newPassword: '', confirmPassword: '' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: checked
        ? [...prev.selectedRoles, roleId]
        : prev.selectedRoles.filter(id => id !== roleId)
    }))
  }

  // Calculate password strength
  const getPasswordStrength = () => {
    const password = passwordData.newPassword
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']
    
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl lg:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl">Edit User</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Update user information, roles, and permissions
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Security</h3>
                <Button
                  type="button"
                  variant={showPasswordFields ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setShowPasswordFields(!showPasswordFields)}
                  className="h-9"
                >
                  {showPasswordFields ? '✕ Cancel Password Reset' : '🔒 Reset Password'}
                </Button>
              </div>
              
              {showPasswordFields && (
                <div className="space-y-4 p-5 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-base font-medium">
                        New Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min 6 characters)"
                        className="h-11"
                      />
                      {passwordData.newPassword && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>Password Strength:</span>
                            <span className="font-medium">{passwordStrength.label}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`${passwordStrength.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-base font-medium">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="h-11"
                      />
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                      {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                        <p className="text-xs text-green-500">✓ Passwords match</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role Assignment Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold border-b pb-2">Role Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-base font-medium">
                    Primary Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="COORDINATOR">Coordinator</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The main role that defines user access level
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-base font-medium">Account Status</Label>
                  <div className="flex items-center space-x-3 h-11">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                      className="h-5 w-5"
                    />
                    <Label htmlFor="isActive" className="text-base cursor-pointer">
                      {formData.isActive ? '✓ Active' : '✕ Inactive'}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.isActive ? 'User can access the system' : 'User cannot access the system'}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Roles Section */}
            {roles.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Additional Roles</h3>
                  <span className="text-sm text-muted-foreground">
                    {formData.selectedRoles.length} of {roles.length} selected
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Checkbox
                          id={`edit-${role.id}`}
                          checked={formData.selectedRoles.includes(role.id)}
                          onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                          className="mt-0.5 h-4 w-4"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`edit-${role.id}`} className="text-sm font-medium cursor-pointer">
                            {role.name}
                          </Label>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Actions */}
          <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (showPasswordFields && passwordData.newPassword !== passwordData.confirmPassword)}
              className="h-11 px-6"
            >
              {loading ? 'Updating User...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
