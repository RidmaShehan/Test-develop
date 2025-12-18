'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  BarChart3, 
  GraduationCap, 
  Settings,
  LogOut,
  Shield,
  Megaphone,
  Trash2,
  Activity,
  MessageSquare,
  Calendar,
  CalendarDays,
  FolderOpen,
  Target,
  Mail,
  ChevronDown,
  ChevronRight,
  FileText,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Button } from '@/components/ui/button'
// import { useClerk } from '@clerk/nextjs'
import { useTheme } from '@/lib/theme-provider'

type NavigationItem = {
  name: string
  href?: string
  icon: any
  permissions: string[]
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard,
    permissions: [] // Dashboard is accessible to all authenticated users
  },
  { 
    name: 'Inquiries', 
    href: '/inquiries', 
    icon: Users,
    permissions: ['READ_SEEKER']
  },
  { 
    name: 'Tasks', 
    href: '/tasks', 
    icon: CheckSquare,
    permissions: ['READ_TASK']
  },
  { 
    name: 'Calendar', 
    href: '/calendar', 
    icon: CalendarDays,
    permissions: ['READ_TASK', 'READ_SEEKER']
  },
  { 
    name: 'Meetings', 
    href: '/meetings', 
    icon: Calendar,
    permissions: ['READ_TASK'] // Using task permissions for now
  },
  { 
    name: 'Projects', 
    href: '/projects', 
    icon: FolderOpen,
    permissions: ['READ_PROJECT']
  },
  { 
    name: 'Notebooks', 
    href: '/notebooks', 
    icon: BookOpen,
    permissions: ['READ_NOTEBOOK']
  },
  { 
    name: 'Campaigns', 
    href: '/campaigns', 
    icon: Megaphone,
    permissions: ['READ_CAMPAIGN']
  },
  { 
    name: 'Social Media Posts', 
    href: '/posts', 
    icon: FileText,
    permissions: ['READ_CAMPAIGN', 'CREATE_CAMPAIGN']
  },
  { 
    name: 'Trash Bin', 
    href: '/trash', 
    icon: Trash2,
    permissions: ['READ_CAMPAIGN']
  },
  { 
    name: 'Reports', 
    icon: BarChart3,
    permissions: ['VIEW_REPORTS', 'READ_USER'], // Show if user has any of these
    children: [
      { 
        name: 'Reports & Analytics', 
        href: '/reports', 
        icon: BarChart3,
        permissions: ['VIEW_REPORTS']
      },
      { 
        name: 'Annual Reports', 
        href: '/annual-reports', 
        icon: FileText,
        permissions: ['READ_USER'] // Only admin and administrator can view
      },
      { 
        name: 'Activity Logs', 
        href: '/activity-logs', 
        icon: Activity,
        permissions: ['READ_USER'] // Only admin and administrator can view
      },
    ]
  },
  { 
    name: 'Programs', 
    href: '/programs', 
    icon: GraduationCap,
    permissions: ['READ_PROGRAM']
  },
  { 
    name: 'Q&A Management', 
    href: '/q-and-a', 
    icon: MessageSquare,
    permissions: ['READ_PROGRAM']
  },
  { 
    name: 'AI Chat', 
    href: '/chat', 
    icon: Sparkles,
    permissions: [] // Available to all authenticated users
  },
  { 
    name: 'Program Descriptions', 
    href: '/program-descriptions', 
    icon: FileText,
    permissions: ['READ_PROGRAM']
  },
  { 
    name: 'User Management', 
    href: '/user-management', 
    icon: Shield,
    permissions: ['READ_USER', 'READ_ROLE']
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    permissions: ['VIEW_SYSTEM_SETTINGS']
  },
]

// Removed SidebarProps interface as it's no longer needed

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, mounted } = useTheme()
  const { logout } = useAuth()
  const { hasAnyPermission } = usePermissions()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Prevent hydration mismatch by using default state until mounted
  const isCollapsed = mounted ? sidebarCollapsed : false

  // Auto-expand Reports if any child is active
  const reportsItem = navigation.find(item => item.name === 'Reports')
  const isReportsActive = reportsItem?.children?.some(child => pathname === child.href)

  // Initialize expanded state based on active path
  useEffect(() => {
    if (isReportsActive) {
      setExpandedItems(prev => {
        if (!prev.has('Reports')) {
          return new Set(prev).add('Reports')
        }
        return prev
      })
    }
  }, [pathname, isReportsActive])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemName)) {
        newSet.delete(itemName)
      } else {
        newSet.add(itemName)
      }
      return newSet
    })
  }

  const hasAccessToItem = (item: NavigationItem): boolean => {
    if (item.permissions.length === 0) return true
    return hasAnyPermission(item.permissions)
  }

  const hasAccessToAnyChild = (item: NavigationItem): boolean => {
    if (!item.children) return false
    return item.children.some(child => hasAccessToItem(child))
  }

  const renderNavigationItem = (item: NavigationItem) => {
    // Check if user has access to this item or any of its children
    if (!hasAccessToItem(item) && !hasAccessToAnyChild(item)) {
      return null
    }

    const isExpanded = expandedItems.has(item.name) || (item.name === 'Reports' && isReportsActive)
    const hasChildren = item.children && item.children.length > 0
    const isActive = pathname === item.href || (hasChildren && item.children?.some(child => pathname === child.href))

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => !isCollapsed && toggleExpanded(item.name)}
            className={cn(
              'group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 ml-auto" />
                ) : (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </>
            )}
          </button>
          
          {/* Submenu */}
          {!isCollapsed && isExpanded && (
            <div className="ml-4 space-y-1 border-l border-sidebar-accent pl-2">
              {item.children
                ?.filter(child => hasAccessToItem(child))
                .map((child) => {
                  const isChildActive = pathname === child.href
                  return (
                    <Link
                      key={child.name}
                      href={child.href || '#'}
                      className={cn(
                        'group flex items-center px-2 py-1.5 text-sm rounded-md transition-colors',
                        isChildActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <child.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{child.name}</span>
                    </Link>
                  )
                })}
            </div>
          )}
        </div>
      )
    }

    // Regular navigation item without children
    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        className={cn(
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isCollapsed && "justify-center"
        )}
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0",
          !isCollapsed && "mr-3"
        )} />
        {!isCollapsed && item.name}
      </Link>
    )
  }

  return (
    <div className={cn(
      "flex h-full flex-col bg-sidebar border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "flex h-16 items-center justify-between px-4",
        isCollapsed && "justify-center"
      )}>
        <div className="flex items-center flex-1">
          {!isCollapsed && (
            <h1
              className="text-xl font-bold text-sidebar-foreground"
              suppressHydrationWarning
            >
              Education CRM
            </h1>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex-shrink-0">
            <NotificationBell />
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation
          .map((item) => renderNavigationItem(item))}
        
        {/* WhatsApp Campaign Button */}
        {hasAnyPermission(['READ_CAMPAIGN', 'READ_SEEKER']) && (
          <button
            onClick={() => router.push('/whatsapp-campaign')}
            className={cn(
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full',
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 border border-green-200 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700/50',
              pathname === '/whatsapp-campaign' && 'bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-700/50',
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "WhatsApp Campaign" : undefined}
          >
            <MessageSquare className={cn(
              "h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && (
              <span className="text-green-700 dark:text-green-300 font-medium">WhatsApp Campaign</span>
            )}
          </button>
        )}

        {/* Email Campaign Button */}
        {hasAnyPermission(['READ_CAMPAIGN', 'READ_SEEKER']) && (
          <button
            onClick={() => router.push('/email-campaign')}
            className={cn(
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors w-full',
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700/50',
              pathname === '/email-campaign' && 'bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/50',
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Email Campaign" : undefined}
          >
            <Mail className={cn(
              "h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && (
              <span className="text-blue-700 dark:text-blue-300 font-medium">Email Campaign</span>
            )}
          </button>
        )}
      </nav>
      <div className="p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-sidebar-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent transition-all duration-200 group",
            isCollapsed && "justify-center px-2"
          )}
          onClick={logout}
          title={isCollapsed ? "Sign out" : undefined}
        >
          <LogOut className={cn(
            "h-5 w-5 group-hover:text-red-600",
            !isCollapsed && "mr-3"
          )} />
          {!isCollapsed && "Sign out"}
        </Button>
      </div>
    </div>
  )
}
