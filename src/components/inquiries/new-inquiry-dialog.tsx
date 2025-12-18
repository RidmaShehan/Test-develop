// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { StatusBar } from '@/components/ui/status-bar'
import { MessageSquare, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'
import { QAQuickViewDialog } from './qa-quick-view-dialog'
import { ProgramDetailsQuickViewDialog } from './program-details-quick-view-dialog'

const inquirySchema = z.object({
  fullName: z.string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number can only contain numbers, +, -, spaces, and parentheses'),
  
  whatsappNumber: z.string()
    .optional()
    .refine((val) => !val || val.length >= 10, 'WhatsApp number must be at least 10 digits if provided')
    .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'WhatsApp number can only contain numbers, +, -, spaces, and parentheses'),
  
  email: z.string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, 'Please enter a valid email address'),
  
  district: z.string()
    .optional()
    .refine((val) => !val || SRI_LANKAN_DISTRICTS.includes(val), 'Please select a valid Sri Lankan district'),
  
  age: z.preprocess(
    (val) => {
      // Convert NaN, empty string, or undefined to undefined
      if (val === '' || val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
        return undefined
      }
      return val
    },
    z.union([
      z.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120'),
      z.undefined()
    ]).optional()
  ),
  
  guardianPhone: z.string()
    .optional()
    .refine((val) => !val || val.length >= 10, 'Guardian phone must be at least 10 digits if provided')
    .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Guardian phone can only contain numbers, +, -, spaces, and parentheses'),
  
  programInterestId: z.string().optional(),
  
  marketingSource: z.string()
    .max(100, 'Marketing source must be less than 100 characters')
    .optional(),
  
  campaignId: z.string().optional(),
  
  preferredContactTime: z.string()
    .optional()
    .refine((val) => !val || val.length <= 100, 'Preferred contact time must be less than 100 characters'),
  
  preferredStatus: z.number()
    .min(1, 'Preferred status must be at least 1')
    .max(10, 'Preferred status must be at most 10')
    .optional(),
  
  followUpAgain: z.boolean().optional().default(false),
  followUpDate: z.string().optional(),
  followUpTime: z.string().optional(),
  
  description: z.string()
    .optional()
    .refine((val) => !val || val.length <= 1000, 'Description must be less than 1000 characters'),
  
  // Call start time (HH:mm) used to auto-calculate call duration on submit
  callStartTime: z.string().optional(),

  // Toggle: Auto / Manually (replaces Call Duration field)
  callMode: z.enum(['AUTO', 'MANUAL']).optional().default('AUTO'),

  whatsapp: z.boolean().optional().default(false),
  notAnswering: z.boolean().optional().default(false),
  emailNotAnswering: z.boolean().optional().default(false),
  consent: z.boolean().optional().default(false),
  registerNow: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  // Marketing source is required unless "Not Answering" is checked
  if (!data.notAnswering && (!data.marketingSource || !data.marketingSource.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Marketing source is required',
      path: ['marketingSource']
    })
  }
  
  // Age validation is skipped when "Not Answering" is checked
  // Only validate age if it's provided and "Not Answering" is not checked
  if (!data.notAnswering && data.age !== undefined && data.age !== '' && !isNaN(data.age as number)) {
    const ageNum = Number(data.age)
    if (ageNum < 1 || ageNum > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Age must be between 1 and 120',
        path: ['age']
      })
    }
  }
  
  // If follow-up is enabled, date and time are required
  if (data.followUpAgain) {
    // Check for non-empty strings (trimmed)
    const hasDate = data.followUpDate && data.followUpDate.trim().length > 0
    const hasTime = data.followUpTime && data.followUpTime.trim().length > 0
    
    if (!hasDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Follow-up date is required when follow-up is enabled',
        path: ['followUpDate']
      })
    }
    
    if (!hasTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Follow-up time is required when follow-up is enabled',
        path: ['followUpTime']
      })
    }
  }
})

type InquiryFormData = z.infer<typeof inquirySchema>

interface NewInquiryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Sri Lankan districts list (will be shown in alphabetical order by default)
const SRI_LANKAN_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle',
  'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
  'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
]

interface CampaignType {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
}

interface Campaign {
  id: string
  name: string
  description?: string
  type: string
  status: string
  imageUrl?: string
}

export function NewInquiryDialog({ open, onOpenChange }: NewInquiryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; level: string; campus: string }>>([])
  const [programsLoading, setProgramsLoading] = useState(false)
  const [programSearch, setProgramSearch] = useState('')
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([])
  const [showProgramList, setShowProgramList] = useState(false)
  const [districtSearch, setDistrictSearch] = useState('')
  const [showDistrictList, setShowDistrictList] = useState(false)
  const [campaignTypes, setCampaignTypes] = useState<CampaignType[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [showQAQuickView, setShowQAQuickView] = useState(false)
  const [showProgramDetails, setShowProgramDetails] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)

  // Initialize keyboard navigation
  useKeyboardNavigation({
    formRef,
    onSubmit: () => form.handleSubmit(onSubmit)(),
    enableEnterToNextField: true,
    enableArrowNavigation: true,
  })

  // Check if form is valid for submission
  const isFormValid = () => {
    const values = form.getValues()
    const errors = form.formState.errors
    
    // If "Not Answering" is checked, allow submission with minimal requirements
    if (values.notAnswering) {
      // Still need at least full name and phone
      const hasMinimalFields = values.fullName?.trim() && values.phone?.trim()
      // Only check for errors on critical fields (fullName and phone)
      // Ignore age, marketingSource, and other optional field errors
      const hasCriticalErrors = errors.fullName || errors.phone
      return hasMinimalFields && !hasCriticalErrors
    }
    
    // Normal validation: Check required fields
    const hasRequiredFields = values.fullName?.trim() && 
                             values.phone?.trim() && 
                             values.marketingSource?.trim()
    
    // Check if there are any validation errors
    const hasValidationErrors = Object.keys(errors).length > 0
    
    return hasRequiredFields && !hasValidationErrors
  }
  const districtRef = useRef<HTMLDivElement>(null)
  
  // Close district dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictList(false)
      }
    }
    
    if (showDistrictList) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDistrictList])
  
  const focusNextField = (current: HTMLElement) => {
    const container = formRef.current
    if (!container) return
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'))
    const index = focusables.indexOf(current)
    if (index >= 0) {
      const next = focusables[index + 1]
      if (next) next.focus()
    }
  }
  const handleEnterAdvance: React.KeyboardEventHandler<HTMLElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      focusNextField(e.currentTarget as HTMLElement)
    }
  }
  
  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: '',
      phone: '',
      whatsappNumber: '',
      email: '',
      district: '',
      age: undefined,
      guardianPhone: '',
      programInterestId: '',
      marketingSource: '',
      campaignId: '',
      preferredContactTime: '',
      preferredStatus: undefined,
      followUpAgain: false,
      followUpDate: '',
      followUpTime: '',
      description: '',
      callStartTime: '',
      callMode: 'AUTO',
      whatsapp: false,
      notAnswering: false,
      emailNotAnswering: false,
      consent: false,
      registerNow: false,
    },
    mode: 'onChange', // Validate on change for better UX
  })

  // Auto-copy phone number to WhatsApp number when WhatsApp checkbox is checked
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'phone' && form.getValues('whatsapp') && value.phone) {
        form.setValue('whatsappNumber', value.phone)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Initialize district search when form is opened
  useEffect(() => {
    if (open) {
      const currentDistrict = form.getValues('district')
      if (currentDistrict) {
        setDistrictSearch(currentDistrict)
      }
      // Reset form validation errors when dialog opens
      form.clearErrors()
      // Reset form state
      form.reset({
        fullName: '',
        phone: '',
        whatsappNumber: '',
        email: '',
        district: '',
        age: undefined,
        guardianPhone: '',
        programInterestId: '',
        marketingSource: '',
        campaignId: '',
        preferredContactTime: '',
        preferredStatus: undefined,
        followUpAgain: false,
        followUpDate: '',
        followUpTime: '',
        description: '',
        callStartTime: '',
        callMode: 'AUTO',
        whatsapp: false,
        notAnswering: false,
        emailNotAnswering: false,
        consent: false,
        registerNow: false,
      })
      // Reset other state
      setSelectedProgramIds([])
      setProgramSearch('')
      setDistrictSearch('')
      setCampaigns([])
    }
  }, [open, form])

  // If Date Auto is ON, set call start time automatically when opening the dialog
  useEffect(() => {
    if (!open) return
    if (form.getValues('callMode') !== 'AUTO') return
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    form.setValue('callStartTime', `${hh}:${mm}`)
  }, [open, form])

  const fetchCampaignsByType = async (campaignType: string) => {
    setCampaignsLoading(true)
    try {
      // Use forInquiry=true to allow all users to see all ACTIVE campaigns
      const response = await fetch(`/api/campaigns?type=${campaignType}&limit=100&forInquiry=true`)
      if (response.ok) {
        const data = await response.json()
        // Handle new paginated response structure
        const campaigns = data.campaigns || (Array.isArray(data) ? data : [])
        // Filter to only show ACTIVE campaigns (API already filters, but double-check)
        setCampaigns(campaigns.filter((campaign: Campaign) => campaign.status === 'ACTIVE'))
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setCampaignsLoading(false)
    }
  }

  useEffect(() => {
    const fetchPrograms = async () => {
      setProgramsLoading(true)
      try {
        const res = await fetch('/api/programs')
        if (res.ok) {
          const data = await res.json()
          setPrograms(data)
        }
      } catch (e) {
        console.error('Failed to load programs', e)
      } finally {
        setProgramsLoading(false)
      }
    }
    
    const fetchCampaignTypes = async () => {
      try {
        const res = await fetch('/api/campaign-types')
        if (res.ok) {
          const data = await res.json()
          setCampaignTypes(data.filter((type: CampaignType) => type.isActive))
        }
      } catch (e) {
        console.error('Failed to load campaign types', e)
      }
    }
    
    fetchPrograms()
    fetchCampaignTypes()
  }, [])

  // Fetch campaigns when marketing source changes
  useEffect(() => {
    const marketingSource = form.watch('marketingSource')
    if (marketingSource) {
      // Clear the selected campaign when marketing source changes
      form.setValue('campaignId', '')
      setCampaigns([])
      // Fetch new campaigns for the selected type
      fetchCampaignsByType(marketingSource)
    } else {
      // Clear everything if no marketing source selected
      form.setValue('campaignId', '')
      setCampaigns([])
    }
  }, [form.watch('marketingSource')])

  const onSubmit = async (data: InquiryFormData) => {
    setIsLoading(true)
    try {
      // Additional validation before submission
      if (!data.fullName?.trim()) {
        toast.error('Full name is required')
        return
      }
      
      if (!data.phone?.trim()) {
        toast.error('Phone number is required')
        return
      }
      
      // Marketing source is optional when "Not Answering" is checked
      if (!data.notAnswering && !data.marketingSource?.trim()) {
        toast.error('Marketing source is required')
        return
      }

      // Validate phone number format
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/
      if (!phoneRegex.test(data.phone)) {
        toast.error('Please enter a valid phone number')
        return
      }

      // Validate WhatsApp number if provided
      if (data.whatsappNumber && !phoneRegex.test(data.whatsappNumber)) {
        toast.error('Please enter a valid WhatsApp number')
        return
      }

      // Validate guardian phone if provided
      if (data.guardianPhone && !phoneRegex.test(data.guardianPhone)) {
        toast.error('Please enter a valid guardian phone number')
        return
      }

      // Validate email if provided
      if (data.email && data.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
          toast.error('Please enter a valid email address')
          return
        }
      }

      // Validate district if provided
      if (data.district && data.district.trim() && !SRI_LANKAN_DISTRICTS.includes(data.district)) {
        toast.error('Please select a valid Sri Lankan district')
        return
      }

      // Calculate call duration (minutes) if callStartTime is available (HH:mm)
      // Skip calculating duration when "Not Answering" is checked
      let callDurationMinutes: number | undefined = undefined
      if (
        !data.notAnswering &&
        data.callStartTime &&
        typeof data.callStartTime === 'string' &&
        data.callStartTime.includes(':')
      ) {
        const [hhStr, mmStr] = data.callStartTime.split(':')
        const hh = Number(hhStr)
        const mm = Number(mmStr)
        if (!isNaN(hh) && !isNaN(mm)) {
          const now = new Date()
          const start = new Date(now)
          start.setHours(hh, mm, 0, 0)
          const diffMs = now.getTime() - start.getTime()
          callDurationMinutes = Math.max(0, Math.round(diffMs / 60000))
        }
      }

      // Map form data to Seeker model fields
      const formData = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        city: data.district?.trim() || undefined, // Map district to city
        ageBand: (data.age && !isNaN(data.age as number) && data.age !== '') ? data.age.toString() : undefined, // Convert age to ageBand string
        guardianPhone: data.guardianPhone?.trim() || undefined,
        marketingSource: data.marketingSource?.trim() || 'UNKNOWN', // Use 'UNKNOWN' as default when not provided
        campaignId: data.campaignId || undefined,
        preferredContactTime: data.preferredContactTime?.trim() || undefined,
        followUpAgain: data.followUpAgain ?? false,
        followUpDate: data.followUpDate || undefined,
        followUpTime: data.followUpTime || undefined,
        description: data.description?.trim() || undefined,
        callStartTime: data.callStartTime || undefined,
        callDurationMinutes,
        whatsapp: data.whatsapp,
        notAnswering: data.notAnswering ?? false,
        emailNotAnswering: data.emailNotAnswering ?? false,
        consent: data.consent,
        registerNow: data.registerNow ?? false,
        programInterestId: selectedProgramIds[0] ?? undefined, // Keep for backward compatibility
        preferredProgramIds: selectedProgramIds, // Send all selected program IDs
        whatsappNumber: data.whatsappNumber?.trim() || undefined,
      }

      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Get response text first (can only read once)
      const responseText = await response.text()
      
      if (!response.ok) {
        let errorData
        try {
          errorData = responseText ? JSON.parse(responseText) : { error: 'Unknown error' }
        } catch (e) {
          errorData = { error: `Failed to create inquiry (Status: ${response.status})` }
        }
        throw new Error(errorData.error || 'Failed to create inquiry')
      }

      // Parse successful response
      let responseData
      try {
        responseData = responseText ? JSON.parse(responseText) : {}
      } catch (e) {
        throw new Error(`Invalid response from server: ${responseText || 'Empty response'}`)
      }

      const successMessage = responseData.followUpAgain 
        ? 'Inquiry created successfully with follow-up task assigned'
        : 'Inquiry created successfully'
      
      toast.success(successMessage)
      form.reset()
      onOpenChange(false)
      // Refresh the inquiries list
      window.location.reload()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create inquiry'
      toast.error(errorMessage)
      console.error('Error creating inquiry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[95vh] flex flex-col p-4 sm:p-5 md:p-6 overflow-hidden">
        <DialogHeader className="pb-3 sm:pb-4 border-b border-gray-200">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Add New Inquiry</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2.5 sm:space-y-3 mt-2 sm:mt-3">
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs sm:text-sm font-medium">Full Name *</Label>
              <Input
                id="fullName"
                {...form.register('fullName')}
                placeholder="Enter full name"
                onKeyDown={handleEnterAdvance}
                className="w-full"
              />
              {form.formState.errors.fullName && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">Phone Number *</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                placeholder="Enter phone number"
                onKeyDown={handleEnterAdvance}
                className="w-full"
              />
              {form.formState.errors.phone && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5 flex items-end">
              {/* WhatsApp checkbox */}
              <div className="flex items-center space-x-2 h-9 sm:h-10">
                <Checkbox
                  id="whatsapp"
                  checked={form.watch('whatsapp')}
                  onCheckedChange={(checked) => {
                    form.setValue('whatsapp', checked as boolean)
                    if (checked && form.getValues('phone')) {
                      form.setValue('whatsappNumber', form.getValues('phone'))
                    }
                  }}
                />
                <Label htmlFor="whatsapp" className="text-sm font-normal cursor-pointer">
                  Has WhatsApp
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsappNumber" className="text-xs sm:text-sm font-medium">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                {...form.register('whatsappNumber')}
                placeholder="WhatsApp number"
                onKeyDown={handleEnterAdvance}
                className="w-full"
              />
              {form.formState.errors.whatsappNumber && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.whatsappNumber.message}</p>
              )}
            </div>

            <div className="space-y-1.5 flex items-end">
              {/* Not Answering checkbox */}
              <div className="flex items-center space-x-2 h-9 sm:h-10">
                <Checkbox
                  id="notAnswering"
                  checked={form.watch('notAnswering')}
                  disabled={form.watch('registerNow')}
                  onCheckedChange={(checked) => {
                    form.setValue('notAnswering', checked as boolean)
                    // If Not Answering, disable Register Now and uncheck it
                    if (checked) {
                      form.setValue('registerNow', false)
                    }
                    // Clear errors for optional fields when checking "Not Answering"
                    if (checked) {
                      form.clearErrors('marketingSource')
                      form.clearErrors('age')
                    }
                    // Trigger validation to update button state
                    setTimeout(() => {
                      form.trigger(['marketingSource', 'fullName', 'phone', 'age'])
                    }, 100)
                  }}
                />
                <Label htmlFor="notAnswering" className="text-sm font-normal cursor-pointer">
                  Not Answering
                </Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="Enter email address"
                onKeyDown={handleEnterAdvance}
                className="w-full"
              />
              {form.formState.errors.email && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="district" className="text-xs sm:text-sm font-medium">District</Label>
              <div className="relative" ref={districtRef}>
                <Input
                  id="district"
                  value={districtSearch}
                  onChange={(e) => {
                    const value = e.target.value
                    setDistrictSearch(value)
                    setShowDistrictList(true)
                    // Only set form value if it matches a valid district
                    const validDistrict = SRI_LANKAN_DISTRICTS.find(d => 
                      d.toLowerCase() === value.toLowerCase()
                    )
                    if (validDistrict) {
                      form.setValue('district', validDistrict)
                    } else if (value === '') {
                      form.setValue('district', '')
                    }
                  }}
                  onFocus={() => setShowDistrictList(true)}
                  onBlur={() => {
                    // Delay hiding to allow click on options
                    setTimeout(() => setShowDistrictList(false), 150)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      // If there's a valid district match, select it
                      const validDistrict = SRI_LANKAN_DISTRICTS.find(d => 
                        d.toLowerCase().includes(districtSearch.toLowerCase())
                      )
                      if (validDistrict) {
                        form.setValue('district', validDistrict)
                        setDistrictSearch(validDistrict)
                        setShowDistrictList(false)
                        focusNextField(e.currentTarget)
                      } else {
                        setShowDistrictList(false)
                        focusNextField(e.currentTarget)
                      }
                    } else if (e.key === 'Escape') {
                      setShowDistrictList(false)
                    }
                  }}
                  placeholder="Type to search district"
                  autoComplete="off"
                />
                {showDistrictList && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg text-sm">
                    {/* Clear selection option */}
                    {form.watch('district') && (
                      <div
                        role="option"
                        tabIndex={0}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          form.setValue('district', '')
                          setDistrictSearch('')
                          setShowDistrictList(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            form.setValue('district', '')
                            setDistrictSearch('')
                            setShowDistrictList(false)
                          }
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2 text-gray-600"
                      >
                        <span className="text-sm">❌</span>
                        <span className="text-sm">Clear selection</span>
                      </div>
                    )}
                    {SRI_LANKAN_DISTRICTS
                      .slice()
                      .sort((a, b) => a.localeCompare(b))
                      .filter((d) => d.toLowerCase().includes(districtSearch.toLowerCase()))
                      .map((d) => (
                        <div
                          key={d}
                          role="option"
                          tabIndex={0}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            form.setValue('district', d)
                            setDistrictSearch(d)
                            setShowDistrictList(false)
                            // Move to next field after selection
                            setTimeout(() => {
                              const nextField = document.getElementById('age')
                              if (nextField) nextField.focus()
                            }, 100)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              form.setValue('district', d)
                              setDistrictSearch(d)
                              setShowDistrictList(false)
                              // Move to next field after selection
                              setTimeout(() => {
                                const nextField = document.getElementById('age')
                                if (nextField) nextField.focus()
                              }, 100)
                            }
                          }}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2 ${
                            form.watch('district') === d ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span className="text-sm">📍</span>
                          <span>{d}</span>
                        </div>
                      ))}
                    {districtSearch && SRI_LANKAN_DISTRICTS.filter(d => 
                      d.toLowerCase().includes(districtSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No districts found matching "{districtSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              {form.formState.errors.district && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.district.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-xs sm:text-sm font-medium">Age</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                {...form.register('age', { valueAsNumber: true })}
                placeholder="Enter age"
                onKeyDown={handleEnterAdvance}
                className="w-full"
              />
              {form.formState.errors.age && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.age.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guardianPhone" className="text-xs sm:text-sm font-medium">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                {...form.register('guardianPhone')}
                placeholder="Enter guardian phone"
                onKeyDown={handleEnterAdvance}
                className="w-full"
              />
              {form.formState.errors.guardianPhone && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.guardianPhone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="callStartTime" className="text-xs sm:text-sm font-medium">Call Start Time</Label>
              <Input
                id="callStartTime"
                type="time"
                {...form.register('callStartTime')}
                onKeyDown={handleEnterAdvance}
                disabled={form.watch('callMode') === 'AUTO'}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-medium">Auto Time</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="callMode"
                  checked={form.watch('callMode') === 'AUTO'}
                  onCheckedChange={(checked) => {
                    form.setValue('callMode', checked ? 'AUTO' : 'MANUAL')
                    if (checked) {
                      const now = new Date()
                      const hh = String(now.getHours()).padStart(2, '0')
                      const mm = String(now.getMinutes()).padStart(2, '0')
                      form.setValue('callStartTime', `${hh}:${mm}`)
                    }
                  }}
                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-600"
                />
                <span className="sr-only">
                  {form.watch('callMode') === 'AUTO' ? 'Auto Time' : 'Manually'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex items-end">
              {/* Register Now checkbox */}
              <div className="flex items-center space-x-2 h-9 sm:h-10">
                <Checkbox
                  id="registerNow"
                  checked={form.watch('registerNow')}
                  disabled={form.watch('notAnswering')}
                  onCheckedChange={(checked) => {
                    form.setValue('registerNow', checked as boolean)
                    // If Register Now, disable Not Answering and uncheck it
                    if (checked) {
                      form.setValue('notAnswering', false)
                    }
                  }}
                />
                <Label htmlFor="registerNow" className="text-sm font-normal cursor-pointer">
                  Register Now
                </Label>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="programInterestId" className="text-xs sm:text-sm font-medium">Preferred Programs</Label>
                {selectedProgramIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProgramDetails(true)}
                      className="h-7 text-xs gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQAQuickView(true)}
                      className="h-7 text-xs gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      View Q&A
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedProgramIds
                    .map(id => programs.find(p => p.id === id))
                    .filter(Boolean)
                    .map((p) => (
                      <span key={p!.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-sm">
                        {p!.name}
                        <button
                          type="button"
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedProgramIds(prev => prev.filter(pid => pid !== p!.id))}
                          aria-label={`Remove ${p!.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                </div>
                <Input
                  id="programInterestId"
                  value={programSearch}
                  onChange={(e) => {
                    setProgramSearch(e.target.value)
                    setShowProgramList(true)
                  }}
                  onFocus={() => setShowProgramList(true)}
                  placeholder={programsLoading ? 'Loading programs...' : 'Type to search and select programs'}
                  autoComplete="off"
                onKeyDown={handleEnterAdvance}
                />
                {showProgramList && programSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow text-sm">
                    {programs
                      .filter((p) => {
                        const q = programSearch.trim().toLowerCase()
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.level.toLowerCase().includes(q) ||
                          p.campus.toLowerCase().includes(q)
                        )
                      })
                      .filter(p => !selectedProgramIds.includes(p.id))
                      .sort((a, b) => {
                        const q = programSearch.trim().toLowerCase()
                        const aName = a.name.toLowerCase()
                        const bName = b.name.toLowerCase()
                        
                        // Exact name matches first
                        if (aName === q && bName !== q) return -1
                        if (bName === q && aName !== q) return 1
                        
                        // Name starts with query
                        if (aName.startsWith(q) && !bName.startsWith(q)) return -1
                        if (bName.startsWith(q) && !aName.startsWith(q)) return 1
                        
                        // Name contains query
                        if (aName.includes(q) && !bName.includes(q)) return -1
                        if (bName.includes(q) && !aName.includes(q)) return 1
                        
                        // Alphabetical fallback
                        return aName.localeCompare(bName)
                      })
                      .map((p) => (
                        <div
                          key={p.id}
                          role="option"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedProgramIds(prev => [...prev, p.id])
                            setProgramSearch('')
                            setShowProgramList(false)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedProgramIds(prev => [...prev, p.id])
                              setProgramSearch('')
                              setShowProgramList(false)
                            }
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.level} — {p.campus}</span>
                          </div>
                        </div>
                      ))}
                    {programs
                      .filter((p) => {
                        const q = programSearch.trim().toLowerCase()
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.level.toLowerCase().includes(q) ||
                          p.campus.toLowerCase().includes(q)
                        )
                      })
                      .filter(p => !selectedProgramIds.includes(p.id)).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3 xl:col-span-4 pt-1 border-t border-gray-100">
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="followUpAgain"
                  checked={form.watch('followUpAgain')}
                  onCheckedChange={(checked) => {
                    form.setValue('followUpAgain', !!checked)
                    // Trigger validation after checkbox change
                    setTimeout(() => {
                      form.trigger(['followUpDate', 'followUpTime'])
                    }, 100)
                  }}
                />
                <Label htmlFor="followUpAgain" className="text-sm font-medium cursor-pointer">Follow up again?</Label>
              </div>
              {form.watch('followUpAgain') && (
                <div className="space-y-2.5 mt-2 pl-3 sm:pl-4 border-l-2 border-blue-200 bg-blue-50/30 rounded-r-md p-2.5 sm:p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="followUpDate" className="text-xs sm:text-sm font-medium">Follow-up Date *</Label>
                      <Input
                        id="followUpDate"
                        type="date"
                        {...form.register('followUpDate', {
                          onChange: () => {
                            // Re-validate both fields when date changes
                            setTimeout(() => {
                              form.trigger(['followUpDate', 'followUpTime'])
                            }, 100)
                          }
                        })}
                        min={new Date().toISOString().split('T')[0]} // Prevent past dates
                        onKeyDown={handleEnterAdvance}
                        className="w-full"
                      />
                      {form.formState.errors.followUpDate && (
                        <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.followUpDate.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="followUpTime" className="text-xs sm:text-sm font-medium">Follow-up Time *</Label>
                      <Input
                        id="followUpTime"
                        type="time"
                        {...form.register('followUpTime', {
                          onChange: () => {
                            // Re-validate both fields when time changes
                            setTimeout(() => {
                              form.trigger(['followUpDate', 'followUpTime'])
                            }, 100)
                          }
                        })}
                        onKeyDown={handleEnterAdvance}
                        className="w-full"
                      />
                      {form.formState.errors.followUpTime && (
                        <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.followUpTime.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="preferredContactTime" className="text-xs sm:text-sm font-medium">Additional Notes (Optional)</Label>
                    <Input
                      id="preferredContactTime"
                      {...form.register('preferredContactTime')}
                      placeholder="e.g., Prefer morning calls, available weekends"
                      onKeyDown={handleEnterAdvance}
                      className="w-full"
                    />
                    {form.formState.errors.preferredContactTime && (
                      <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.preferredContactTime.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4 pt-1 border-t border-gray-100">
              <Label htmlFor="description" className="text-xs sm:text-sm font-medium">Description</Label>
              <textarea
                id="description"
                {...form.register('description')}
                className="w-full rounded-md border border-input bg-background p-2 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                rows={2}
                placeholder="Add any notes or description"
                onKeyDown={handleEnterAdvance}
              />
              {form.formState.errors.description && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <Label htmlFor="marketingSource" className="text-xs sm:text-sm font-medium">Marketing Source *</Label>
              <Select onValueChange={(value) => form.setValue('marketingSource', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select marketing source">
                    {form.watch('marketingSource') && (() => {
                      const selectedType = campaignTypes.find(type => type.name === form.watch('marketingSource'))
                      return selectedType ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-sm" 
                               style={{ backgroundColor: selectedType.color ? `${selectedType.color}20` : '#f3f4f6' }}>
                            {selectedType.icon && <span>{selectedType.icon}</span>}
                          </div>
                          <span>{selectedType.name}</span>
                        </div>
                      ) : null
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {campaignTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      <div className="flex items-start space-x-3 py-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg" 
                             style={{ backgroundColor: type.color ? `${type.color}20` : '#f3f4f6' }}>
                          {type.icon && <span>{type.icon}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{type.name}</div>
                          {type.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {type.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.marketingSource && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">{form.formState.errors.marketingSource.message}</p>
              )}
            </div>

            {/* Campaign Selection */}
            {form.watch('marketingSource') && (
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <Label htmlFor="campaignId" className="text-xs sm:text-sm font-medium">Campaign (Optional)</Label>
                <Select
                  onValueChange={(value) => {
                    if (value === '__clear__') {
                      form.setValue('campaignId', '')
                    } else {
                      form.setValue('campaignId', value)
                    }
                  }}
                  value={form.watch('campaignId') || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={campaignsLoading ? "Loading campaigns..." : "Select a campaign"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {/* Clear selection option */}
                    {form.watch('campaignId') && (
                      <SelectItem value="__clear__">
                        <div className="flex items-center space-x-2 py-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-xs">❌</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Clear selection</span>
                        </div>
                      </SelectItem>
                    )}
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        <div className="flex items-start space-x-3 py-2">
                          {campaign.imageUrl ? (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={campaign.imageUrl}
                                alt={campaign.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">📢</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {campaign.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {campaignsLoading && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Loading campaigns...</div>
                    )}
                    {campaigns.length === 0 && !campaignsLoading && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No active campaigns found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preferred Status for Programs */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4 pt-1">
              <Label htmlFor="preferredStatus" className="text-xs sm:text-sm font-medium">Preferred Status for Programs</Label>
              <div className="w-full overflow-x-auto pb-1">
                <StatusBar
                  value={form.watch('preferredStatus') || 0}
                  onChange={(value) => form.setValue('preferredStatus', value)}
                  maxValue={10}
                  className="justify-start min-w-max"
                />
              </div>
              <p className="text-xs text-gray-500">
                Click on a number to set your preferred status level (1-10)
              </p>
            </div>

          </div>


          <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-gray-200 mt-2.5 sm:mt-3 sticky bottom-0 bg-white z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid()}
              className={`w-full sm:w-auto order-1 sm:order-2 relative group ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Create inquiry (⌘/Ctrl + Enter)"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>{isLoading ? 'Creating...' : 'Create Inquiry'}</span>
                {!isLoading && (
                  <kbd className="hidden sm:inline-flex ml-2 px-1.5 py-0.5 text-xs bg-white/20 border border-white/30 rounded font-mono">
                    {typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}↵
                  </kbd>
                )}
              </span>
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>

      <QAQuickViewDialog
        open={showQAQuickView}
        onOpenChange={setShowQAQuickView}
        programIds={selectedProgramIds}
        programNames={selectedProgramIds
          .map(id => programs.find(p => p.id === id))
          .filter(Boolean)
          .map(p => p!.name)}
      />

      <ProgramDetailsQuickViewDialog
        open={showProgramDetails}
        onOpenChange={setShowProgramDetails}
        programIds={selectedProgramIds}
        programNames={selectedProgramIds
          .map(id => programs.find(p => p.id === id))
          .filter(Boolean)
          .map(p => p!.name)}
      />
    </Dialog>
  )
}
