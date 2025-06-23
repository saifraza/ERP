import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Factory, Plus, Trash2, MapPin, Gauge, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import type { FactoryData } from './CompanySetup'

interface FactorySetupProps {
  companyName: string
  initialData: FactoryData[]
  onSubmit: (factories: FactoryData[]) => void
  onBack: () => void
}

const factoryTypes = [
  { value: 'sugar', label: 'Sugar Mill', icon: '🏭' },
  { value: 'ethanol', label: 'Ethanol Plant', icon: '⚗️' },
  { value: 'integrated', label: 'Integrated Unit', icon: '🏢' },
  { value: 'feed', label: 'Animal Feed', icon: '🌾' }
]

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

export default function FactorySetup({ companyName, initialData, onSubmit, onBack }: FactorySetupProps) {
  const [factories, setFactories] = useState<FactoryData[]>(
    initialData.length > 0 ? initialData : [createEmptyFactory()]
  )
  const [currentFactoryIndex, setCurrentFactoryIndex] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FactoryData>({
    defaultValues: factories[currentFactoryIndex]
  })

  const currentType = watch('type')

  function createEmptyFactory(): FactoryData {
    return {
      name: '',
      type: 'sugar',
      addressLine1: '',
      city: '',
      state: '',
      pincode: ''
    }
  }

  const handleFactorySubmit = (data: FactoryData) => {
    const updatedFactories = [...factories]
    updatedFactories[currentFactoryIndex] = data
    setFactories(updatedFactories)

    // If this is the last factory, move to next step
    if (currentFactoryIndex === factories.length - 1) {
      onSubmit(updatedFactories)
    } else {
      // Move to next factory
      setCurrentFactoryIndex(currentFactoryIndex + 1)
      reset(factories[currentFactoryIndex + 1])
    }
  }

  const addFactory = () => {
    const newFactory = createEmptyFactory()
    setFactories([...factories, newFactory])
    setCurrentFactoryIndex(factories.length)
    reset(newFactory)
  }

  const removeFactory = (index: number) => {
    if (factories.length > 1) {
      const updatedFactories = factories.filter((_, i) => i !== index)
      setFactories(updatedFactories)
      
      if (currentFactoryIndex >= updatedFactories.length) {
        setCurrentFactoryIndex(updatedFactories.length - 1)
        reset(updatedFactories[updatedFactories.length - 1])
      } else if (currentFactoryIndex === index) {
        reset(updatedFactories[currentFactoryIndex])
      }
    }
  }

  const switchToFactory = (index: number) => {
    // Save current form data first
    const currentData = watch()
    const updatedFactories = [...factories]
    updatedFactories[currentFactoryIndex] = currentData
    setFactories(updatedFactories)
    
    // Switch to new factory
    setCurrentFactoryIndex(index)
    reset(factories[index])
  }

  const handleFinalSubmit = () => {
    handleSubmit(handleFactorySubmit)()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Factory/Plant Setup</h2>
        <p className="mt-2 text-sm text-gray-600">
          Add all factories and plants under <span className="font-medium">{companyName}</span>
        </p>
      </div>

      {/* Factory Tabs */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {factories.map((factory, index) => (
            <button
              key={index}
              onClick={() => switchToFactory(index)}
              className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                index === currentFactoryIndex
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Factory className="h-4 w-4 mr-2" />
              {factory.name || `Factory ${index + 1}`}
              {factories.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFactory(index)
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </button>
          ))}
          <button
            onClick={addFactory}
            className="flex items-center px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Factory
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFactorySubmit)} className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Factory className="h-5 w-5 mr-2 text-gray-400" />
            Factory Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factory Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name', { required: 'Factory name is required' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Main Sugar Mill"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factory Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {factoryTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                      currentType === type.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('type', { required: 'Factory type is required' })}
                      value={type.value}
                      className="sr-only"
                    />
                    <span className="text-2xl mr-2">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                    {currentType === type.value && (
                      <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-primary-600" />
                    )}
                  </label>
                ))}
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-gray-400" />
            Factory Location
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
                placeholder="Factory premises address"
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
                placeholder="City"
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

        {/* Capacity Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Gauge className="h-5 w-5 mr-2 text-gray-400" />
            Capacity Information (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(currentType === 'sugar' || currentType === 'integrated') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crushing Capacity (TCD)
                </label>
                <input
                  type="number"
                  {...register('crushingCapacity', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5000"
                />
              </div>
            )}

            {(currentType === 'ethanol' || currentType === 'integrated') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ethanol Capacity (KL/day)
                </label>
                <input
                  type="number"
                  {...register('ethanolCapacity', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Power Generation (MW)
              </label>
              <input
                type="number"
                {...register('powerCapacity', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="25"
              />
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Registration Details (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number (if different from company)
              </label>
              <input
                type="text"
                {...register('gstNumber', {
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
                Factory License Number
              </label>
              <input
                type="text"
                {...register('factoryLicense')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="FL/2024/12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pollution Control License
              </label>
              <input
                type="text"
                {...register('pollutionLicense')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="PCB/2024/67890"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </button>

          {currentFactoryIndex < factories.length - 1 ? (
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Save & Next Factory
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Next: Master Data
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  )
}