import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Building, Mail, Phone, Globe, Calendar, MapPin, FileText, ChevronRight, Upload, Image } from 'lucide-react'
import type { CompanyData } from './CompanySetup'

interface CompanyInfoProps {
  initialData: CompanyData | null
  onSubmit: (data: CompanyData) => void
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

const financialYearMonths = [
  { value: 1, label: 'January' },
  { value: 4, label: 'April' },
  { value: 7, label: 'July' },
  { value: 10, label: 'October' }
]

export default function CompanyInfo({ initialData, onSubmit }: CompanyInfoProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CompanyData>({
    defaultValues: initialData || {
      fyStartMonth: 4,
      currentFY: `${currentYear}-${(currentYear + 1).toString().slice(2)}`
    }
  })

  const fyStartMonth = watch('fyStartMonth')

  // Auto-generate current FY based on selected month
  const generateFY = (month: number) => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const year = now.getFullYear()
    
    if (currentMonth >= month) {
      return `${year}-${(year + 1).toString().slice(2)}`
    } else {
      return `${year - 1}-${year.toString().slice(2)}`
    }
  }

  // Handle file uploads
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLetterheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLetterheadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onFormSubmit = async (data: CompanyData) => {
    setIsValidating(true)
    
    // Convert file data to base64 if present
    const formData = { ...data }
    
    if (data.logo && data.logo instanceof FileList && data.logo[0]) {
      const logoFile = data.logo[0]
      const logoBase64 = await fileToBase64(logoFile)
      formData.logo = logoBase64
    }
    
    if (data.letterhead && data.letterhead instanceof FileList && data.letterhead[0]) {
      const letterheadFile = data.letterhead[0]
      const letterheadBase64 = await fileToBase64(letterheadFile)
      formData.letterhead = letterheadBase64
    }
    
    setTimeout(() => {
      setIsValidating(false)
      onSubmit(formData as CompanyData)
    }, 500)
  }
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Company Information</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your company's basic information and registration details
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-gray-400" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Company name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ABC Industries Pvt Ltd"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('legalName', { required: 'Legal name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="As per registration"
              />
              {errors.legalName && (
                <p className="mt-1 text-sm text-red-600">{errors.legalName.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-400" />
            Registration Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('gstNumber', { 
                  required: 'GST number is required',
                  pattern: {
                    value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: 'Invalid GST number format'
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="29ABCDE1234F1Z5"
                maxLength={15}
              />
              {errors.gstNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.gstNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('panNumber', { 
                  required: 'PAN number is required',
                  pattern: {
                    value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                    message: 'Invalid PAN number format'
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ABCDE1234F"
                maxLength={10}
              />
              {errors.panNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.panNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TAN Number
              </label>
              <input
                type="text"
                {...register('tanNumber', {
                  pattern: {
                    value: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
                    message: 'Invalid TAN number format'
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="PUNE12345D"
                maxLength={10}
              />
              {errors.tanNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.tanNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CIN Number
              </label>
              <input
                type="text"
                {...register('cinNumber')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="U12345MH2020PTC123456"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-gray-400" />
            Registered Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('addressLine1', { required: 'Address is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Building/Street"
              />
              {errors.addressLine1 && (
                <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                {...register('addressLine2')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Area/Landmark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('city', { required: 'City is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Mumbai"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                {...register('state', { required: 'State is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('pincode', { 
                  required: 'Pincode is required',
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Invalid pincode'
                  }
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="400001"
                maxLength={6}
              />
              {errors.pincode && (
                <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-gray-400" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="info@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  {...register('phone', { 
                    required: 'Phone is required',
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  {...register('website')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://www.company.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Letterhead & Logo */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Image className="h-5 w-5 mr-2 text-gray-400" />
            Company Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="mx-auto h-24 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoPreview(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Upload your company logo
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  {...register('logo')}
                  onChange={handleLogoChange}
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
                >
                  {logoPreview ? 'Change Logo' : 'Choose File'}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Letterhead Template
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {letterheadPreview ? (
                  <div className="space-y-4">
                    {letterheadPreview.includes('application/pdf') ? (
                      <div className="mx-auto">
                        <FileText className="mx-auto h-16 w-16 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">PDF Letterhead Uploaded</p>
                      </div>
                    ) : (
                      <img
                        src={letterheadPreview}
                        alt="Letterhead preview"
                        className="mx-auto h-32 object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setLetterheadPreview(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Upload letterhead sample
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </>
                )}
                <input
                  type="file"
                  {...register('letterhead')}
                  onChange={handleLetterheadChange}
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  id="letterhead-upload"
                />
                <label
                  htmlFor="letterhead-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer"
                >
                  {letterheadPreview ? 'Change Letterhead' : 'Choose File'}
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Your logo and letterhead will be used in all generated PDFs including Purchase Orders, RFQs, Invoices, and other documents.
            </p>
          </div>
        </div>

        {/* Financial Year */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-gray-400" />
            Financial Year Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Financial Year Starts From <span className="text-red-500">*</span>
              </label>
              <select
                {...register('fyStartMonth', { 
                  required: 'Financial year start month is required',
                  valueAsNumber: true 
                })}
                onChange={(e) => {
                  const month = parseInt(e.target.value)
                  setValue('fyStartMonth', month)
                  setValue('currentFY', generateFY(month))
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {financialYearMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Financial Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('currentFY', { required: 'Current FY is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="2024-25"
              />
              {errors.currentFY && (
                <p className="mt-1 text-sm text-red-600">{errors.currentFY.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isValidating}
            className="flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? 'Validating...' : 'Next: Factory Setup'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}