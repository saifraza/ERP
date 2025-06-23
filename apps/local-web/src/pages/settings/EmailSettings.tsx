import { EmailSettings as EmailSettingsComponent } from '../../components/settings/EmailSettings'

export default function EmailSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Email Settings</h1>
      <EmailSettingsComponent />
    </div>
  )
}