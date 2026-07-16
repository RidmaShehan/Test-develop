'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Save, TestTube2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type SettingsMap = Record<string, string>

function SettingField({
  label, name, value, onChange, type = 'text', placeholder, secret,
}: {
  label: string; name: string; value: string; onChange: (k: string, v: string) => void;
  type?: string; placeholder?: string; secret?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={secret ? 'password' : type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  )
}

function SaveButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <Button onClick={onClick} disabled={isLoading} className="gap-2">
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Save Settings
    </Button>
  )
}

export function IntegrationsSettings() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/system-settings')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSettings(d.data) })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }))

  const save = async (prefix?: string) => {
    setIsSaving(true)
    try {
      const payload = prefix ? Object.fromEntries(Object.entries(settings).filter(([k]) => k.startsWith(prefix))) : settings
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) toast.success('Settings saved successfully')
      else toast.error(data.error || 'Save failed')
    } catch { toast.error('Failed to save') }
    finally { setIsSaving(false) }
  }

  const testSmtp = async () => {
    setIsTesting(true)
    try {
      const res = await fetch('/api/system-settings/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.success) toast.success(data.message || 'SMTP test successful')
      else toast.error(data.error || 'SMTP test failed')
    } catch { toast.error('Test failed') }
    finally { setIsTesting(false) }
  }

  if (isLoading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="flex-wrap h-auto">
        {['general', 'smtp', 'whatsapp', 'cloudinary', 'sms', 'ai'].map((t) => (
          <TabsTrigger key={t} value={t} className="capitalize">{t === 'smtp' ? 'SMTP' : t === 'ai' ? 'AI' : t}</TabsTrigger>
        ))}
      </TabsList>

      {/* General */}
      <TabsContent value="general" className="mt-4">
        <Card>
          <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Institution-wide configuration</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <SettingField label="Institution Name" name="general.institution_name" value={settings['general.institution_name'] || ''} onChange={set} placeholder="TSHE Institute" />
            <SettingField label="Support Email" name="general.support_email" value={settings['general.support_email'] || ''} onChange={set} placeholder="support@example.com" />
            <SettingField label="Timezone" name="general.timezone" value={settings['general.timezone'] || 'Asia/Colombo'} onChange={set} placeholder="Asia/Colombo" />
            <SettingField label="Currency" name="general.currency" value={settings['general.currency'] || 'LKR'} onChange={set} placeholder="LKR" />
            <SettingField label="Allow Self-Registration" name="allow_self_register" value={settings['allow_self_register'] || 'false'} onChange={set} placeholder="true or false" />
            <SaveButton onClick={() => save()} isLoading={isSaving} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* SMTP */}
      <TabsContent value="smtp" className="mt-4">
        <Card>
          <CardHeader><CardTitle>SMTP Email Settings</CardTitle><CardDescription>Configure outgoing email for notifications and documents</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SettingField label="SMTP Host" name="smtp.host" value={settings['smtp.host'] || ''} onChange={set} placeholder="smtp.gmail.com" />
              <SettingField label="SMTP Port" name="smtp.port" value={settings['smtp.port'] || '587'} onChange={set} placeholder="587" />
            </div>
            <SettingField label="Username" name="smtp.user" value={settings['smtp.user'] || ''} onChange={set} placeholder="user@example.com" />
            <SettingField label="Password" name="smtp.password" value={settings['smtp.password'] || ''} onChange={set} secret placeholder="••••••••" />
            <SettingField label="From Name" name="smtp.from_name" value={settings['smtp.from_name'] || 'EduCRM'} onChange={set} placeholder="EduCRM" />
            <SettingField label="From Email" name="smtp.from_email" value={settings['smtp.from_email'] || ''} onChange={set} placeholder="noreply@example.com" />
            <div className="flex gap-3">
              <SaveButton onClick={() => save('smtp')} isLoading={isSaving} />
              <Button variant="outline" onClick={testSmtp} disabled={isTesting} className="gap-2">
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                Test SMTP
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* WhatsApp */}
      <TabsContent value="whatsapp" className="mt-4">
        <Card>
          <CardHeader><CardTitle>WhatsApp Settings</CardTitle><CardDescription>Configure UltraMsg for WhatsApp campaigns</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <SettingField label="UltraMsg Instance ID" name="whatsapp.instance_id" value={settings['whatsapp.instance_id'] || ''} onChange={set} placeholder="instance12345" />
            <SettingField label="UltraMsg API Token" name="whatsapp.token" value={settings['whatsapp.token'] || ''} onChange={set} secret placeholder="••••••••" />
            <SettingField label="Webhook Secret" name="whatsapp.webhook_secret" value={settings['whatsapp.webhook_secret'] || ''} onChange={set} secret placeholder="Use a long random value" />
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
              Set the UltraMsg webhook URL to <code>/api/webhooks/ultramsg?secret=YOUR_WEBHOOK_SECRET</code> and enable “Webhook on Received”.
            </div>
            <SaveButton onClick={() => save('whatsapp')} isLoading={isSaving} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Cloudinary */}
      <TabsContent value="cloudinary" className="mt-4">
        <Card>
          <CardHeader><CardTitle>Cloudinary Settings</CardTitle><CardDescription>Configure Cloudinary for document and media storage</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <SettingField label="Cloud Name" name="cloudinary.cloud_name" value={settings['cloudinary.cloud_name'] || ''} onChange={set} placeholder="your-cloud-name" />
            <SettingField label="API Key" name="cloudinary.api_key" value={settings['cloudinary.api_key'] || ''} onChange={set} placeholder="1234567890" />
            <SettingField label="API Secret" name="cloudinary.api_secret" value={settings['cloudinary.api_secret'] || ''} onChange={set} secret placeholder="••••••••" />
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
              ℹ Changes here require setting the corresponding environment variables (CLOUDINARY_*) for full effect.
            </div>
            <SaveButton onClick={() => save('cloudinary')} isLoading={isSaving} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* SMS */}
      <TabsContent value="sms" className="mt-4">
        <Card>
          <CardHeader><CardTitle>SMS Settings</CardTitle><CardDescription>Configure Notify.lk or Twilio for SMS campaigns</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>SMS Provider</Label>
              <div className="flex gap-3">
                {['notify_lk', 'twilio'].map((p) => (
                  <button key={p} onClick={() => set('sms.provider', p)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${settings['sms.provider'] === p || (!settings['sms.provider'] && p === 'notify_lk') ? 'bg-primary text-white border-primary' : 'border-slate-200 hover:border-slate-300'}`}>
                    {p === 'notify_lk' ? 'Notify.lk' : 'Twilio'}
                  </button>
                ))}
              </div>
            </div>
            {(settings['sms.provider'] === 'notify_lk' || !settings['sms.provider']) ? (
              <>
                <SettingField label="User ID" name="sms.notify_user_id" value={settings['sms.notify_user_id'] || ''} onChange={set} />
                <SettingField label="API Key" name="sms.notify_api_key" value={settings['sms.notify_api_key'] || ''} onChange={set} secret />
                <SettingField label="Sender ID" name="sms.notify_sender_id" value={settings['sms.notify_sender_id'] || 'EduCRM'} onChange={set} />
              </>
            ) : (
              <>
                <SettingField label="Account SID" name="sms.twilio_account_sid" value={settings['sms.twilio_account_sid'] || ''} onChange={set} />
                <SettingField label="Auth Token" name="sms.twilio_auth_token" value={settings['sms.twilio_auth_token'] || ''} onChange={set} secret />
                <SettingField label="From Number" name="sms.twilio_from" value={settings['sms.twilio_from'] || ''} onChange={set} placeholder="+1234567890" />
              </>
            )}
            <SaveButton onClick={() => save('sms')} isLoading={isSaving} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* AI */}
      <TabsContent value="ai" className="mt-4">
        <Card>
          <CardHeader><CardTitle>AI Settings</CardTitle><CardDescription>Configure AI/LLM integrations</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <SettingField label="Gemini API Key" name="ai.gemini_api_key" value={settings['ai.gemini_api_key'] || ''} onChange={set} secret placeholder="AIza..." />
            <SettingField label="OpenAI API Key (optional)" name="ai.openai_api_key" value={settings['ai.openai_api_key'] || ''} onChange={set} secret placeholder="sk-..." />
            <SettingField label="AI Model" name="ai.model" value={settings['ai.model'] || 'gemini-pro'} onChange={set} placeholder="gemini-pro" />
            <SaveButton onClick={() => save('ai')} isLoading={isSaving} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
