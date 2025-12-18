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
import { StatusBar } from '@/components/ui/status-bar'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'

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
  
  district: z.string().optional(),
  
  age: z.union([
    z.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120'),
    z.literal('')
  ]).optional(),
  
  guardianPhone: z.string()
    .optional()
    .refine((val) => !val || val.length >= 10, 'Guardian phone must be at least 10 digits if provided')
    .refine((val) => !val || /^[0-9+\-\s()]+$/.test(val), 'Guardian phone can only contain numbers, +, -, spaces, and parentheses'),
  
  marketingSource: z.string()
    .min(1, 'Marketing source is required')
    .max(100, 'Marketing source must be less than 100 characters'),
  
  campaignId: z.string().optional(),
  
  preferredContactTime: z.string().optional(),
  
  preferredStatus: z.number()
    .min(1, 'Preferred status must be at least 1')
    .max(10, 'Preferred status must be at most 10')
    .optional(),
  
  followUpAgain: z.boolean().optional().default(false),
  followUpDate: z.string().optional(),
  followUpTime: z.string().optional(),
  
  description: z.string().optional(),
  
  whatsapp: z.boolean().optional().default(false),
  notAnswering: z.boolean().optional().default(false),
  emailNotAnswering: z.boolean().optional().default(false),
  consent: z.boolean().optional().default(false),
  
  stage: z.string().optional(),
})

type InquiryFormData = z.infer<typeof inquirySchema>

interface EditInquiryDialogProps {
  inquiry: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Sri Lankan districts list
const SRI_LANKAN_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle',
  'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
  'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya'
]

const INQUIRY_STAGES = [
  { value: 'NEW', label: 'New' },
  { value: 'ATTEMPTING_CONTACT', label: 'Attempting Contact' },
  { value: 'CONNECTED', label: 'Connected' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'COUNSELING_SCHEDULED', label: 'Counseling Scheduled' },
  { value: 'CONSIDERING', label: 'Considering' },
  { value: 'READY_TO_REGISTER', label: 'Ready to Register' },
  { value: 'LOST', label: 'Lost' },
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

export function EditInquiryDialog({ inquiry, open, onOpenChange, onSuccess }: EditInquiryDialogProps) {
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

  const formRef = useRef<HTMLFormElement>(null)
  const districtRef = useRef<HTMLDivElement>(null)

  // Initialize keyboard navigation
  useKeyboardNavigation({
    formRef,
    onSubmit: () => form.handleSubmit(onSubmit)(),
    enableEnterToNextField: true,
    enableArrowNavigation: true,
  })

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
      marketingSource: '',
      campaignId: '',
      preferredContactTime: '',
      preferredStatus: undefined,
      followUpAgain: false,
      followUpDate: '',
      followUpTime: '',
      description: '',
      whatsapp: false,
      notAnswering: false,
      emailNotAnswering: false,
      consent: false,
      stage: 'NEW',
    },
    mode: 'onChange',
  })

  // Load initial data
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

  // Populate form when inquiry changes
  useEffect(() => {
    if (open && inquiry) {
      // Set form values from inquiry
      form.reset({
        fullName: inquiry.fullName || '',
        phone: inquiry.phone || '',
        whatsappNumber: inquiry.whatsappNumber || '',
        email: inquiry.email || '',
        district: inquiry.city || '',
        age: inquiry.ageBand ? parseInt(inquiry.ageBand) : undefined,
        guardianPhone: inquiry.guardianPhone || '',
        marketingSource: inquiry.marketingSource || '',
        campaignId: inquiry.campaigns?.[0]?.campaign?.id || '',
        preferredContactTime: inquiry.preferredContactTime || '',
        preferredStatus: inquiry.preferredStatus || undefined,
        followUpAgain: inquiry.followUpAgain || false,
        followUpDate: '',
        followUpTime: '',
        description: inquiry.description || '',
        whatsapp: inquiry.whatsapp || false,
        notAnswering: inquiry.notAnswering || false,
        emailNotAnswering: inquiry.emailNotAnswering || false,
        consent: inquiry.consent || false,
        stage: inquiry.stage || 'NEW',
      })

      setDistrictSearch(inquiry.city || '')

      // Set selected programs
      if (inquiry.preferredPrograms && inquiry.preferredPrograms.length > 0) {
        setSelectedProgramIds(inquiry.preferredPrograms.map((p: any) => p.program.id))
      } else if (inquiry.programInterest) {
        setSelectedProgramIds([inquiry.programInterest.id])
      } else {
        setSelectedProgramIds([])
      }

      // Fetch campaigns for the marketing source
      if (inquiry.marketingSource) {
        fetchCampaignsByType(inquiry.marketingSource)
      }
    }
  }, [open, inquiry, form])

  const fetchCampaignsByType = async (campaignType: string) => {
    setCampaignsLoading(true)
    try {
      // Use forInquiry=true to allow all users to see all ACTIVE campaigns
      const response = await fetch(`/api/campaigns?type=${campaignType}&limit=100&forInquiry=true`)
      if (response.ok) {
        const data = await response.json()
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

  // Fetch campaigns when marketing source changes
  useEffect(() => {
    const marketingSource = form.watch('marketingSource')
    if (marketingSource) {
      fetchCampaignsByType(marketingSource)
    } else {
      setCampaigns([])
    }
  }, [form.watch('marketingSource')])

  // Auto-copy phone number to WhatsApp number when WhatsApp checkbox is checked
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'phone' && form.getValues('whatsapp') && value.phone) {
        form.setValue('whatsappNumber', value.phone)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

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

  const isFormValid = () => {
    const values = form.getValues()
    const errors = form.formState.errors
    
    const hasRequiredFields = values.fullName?.trim() && 
                             values.phone?.trim() && 
                             values.marketingSource?.trim()
    
    const hasValidationErrors = Object.keys(errors).length > 0
    
    return hasRequiredFields && !hasValidationErrors
  }

  const onSubmit = async (data: InquiryFormData) => {
    setIsLoading(true)
    try {
      // Prepare update data
      const updateData = {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || undefined,
        city: data.district?.trim() || undefined,
        ageBand: data.age ? data.age.toString() : undefined,
        guardianPhone: data.guardianPhone?.trim() || undefined,
        marketingSource: data.marketingSource.trim(),
        campaignId: data.campaignId || undefined,
        preferredContactTime: data.preferredContactTime?.trim() || undefined,
        followUpAgain: data.followUpAgain ?? false,
        followUpDate: data.followUpDate || undefined,
        followUpTime: data.followUpTime || undefined,
        description: data.description?.trim() || undefined,
        whatsapp: data.whatsapp,
        notAnswering: data.notAnswering ?? false,
        emailNotAnswering: data.emailNotAnswering ?? false,
        consent: data.consent,
        preferredProgramIds: selectedProgramIds,
        whatsappNumber: data.whatsappNumber?.trim() || undefined,
        stage: data.stage || 'NEW',
        preferredStatus: data.preferredStatus || undefined,
      }

      const response = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      // Get response text first (can only read once)
      const responseText = await response.text()
      
      if (!response.ok) {
        let errorData
        try {
          errorData = responseText ? JSON.parse(responseText) : { error: 'Unknown error' }
        } catch (e) {
          errorData = { error: `Failed to update inquiry (Status: ${response.status})` }
        }
        throw new Error(errorData.error || 'Failed to update inquiry')
      }

      toast.success('Inquiry updated successfully')
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update inquiry'
      toast.error(errorMessage)
      console.error('Error updating inquiry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[95vh] flex flex-col p-4 sm:p-5 md:p-6 overflow-hidden">
        <DialogHeader className="pb-3 sm:pb-4 border-b border-gray-200">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">Edit Inquiry</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2.5 sm:space-y-3 mt-2 sm:mt-3">
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Full Name */}
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

              {/* Phone */}
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

              {/* WhatsApp Checkbox */}
              <div className="space-y-1.5 flex items-end">
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

              {/* WhatsApp Number */}
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

              {/* Not Answering checkbox */}
              <div className="space-y-1.5 flex items-end">
                <div className="flex items-center space-x-2 h-9 sm:h-10">
                  <Checkbox
                    id="notAnswering"
                    checked={form.watch('notAnswering')}
                    onCheckedChange={(checked) => {
                      form.setValue('notAnswering', checked as boolean)
                    }}
                  />
                  <Label htmlFor="notAnswering" className="text-sm font-normal cursor-pointer">
                    Not Answering
                  </Label>
                </div>
              </div>

              {/* Email */}
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

              {/* District */}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
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
                            }}
                            className={`px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2 ${
                              form.watch('district') === d ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            <span className="text-sm">📍</span>
                            <span>{d}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Age */}
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
              </div>

              {/* Guardian Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="guardianPhone" className="text-xs sm:text-sm font-medium">Guardian Phone</Label>
                <Input
                  id="guardianPhone"
                  {...form.register('guardianPhone')}
                  placeholder="Enter guardian phone"
                  onKeyDown={handleEnterAdvance}
                  className="w-full"
                />
              </div>

              {/* Stage */}
              <div className="space-y-1.5">
                <Label htmlFor="stage" className="text-xs sm:text-sm font-medium">Stage</Label>
                <Select onValueChange={(value) => form.setValue('stage', value)} value={form.watch('stage')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Programs */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <Label htmlFor="programInterestId" className="text-xs sm:text-sm font-medium">Preferred Programs</Label>
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
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">{p.level} — {p.campus}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Marketing Source */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <Label htmlFor="marketingSource" className="text-xs sm:text-sm font-medium">Marketing Source *</Label>
                <Select onValueChange={(value) => form.setValue('marketingSource', value)} value={form.watch('marketingSource')}>
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
                      {form.watch('campaignId') && (
                        <SelectItem value="__clear__">
                          <div className="flex items-center space-x-2 py-2">
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

              {/* Description */}
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-gray-200 mt-2.5 sm:mt-3 sticky bottom-0 bg-white z-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !isFormValid()}
                className={`w-full sm:w-auto order-1 sm:order-2 relative group ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Updating...' : 'Update Inquiry'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

