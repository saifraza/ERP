import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { Building, ChevronDown, Plus, Factory } from 'lucide-react'
import { useCompanyStore } from '../stores/companyStore'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'

export default function CompanySelector() {
  const navigate = useNavigate()
  const { 
    currentCompany, 
    currentFactory, 
    companies, 
    setCurrentCompany,
    setCurrentFactory 
  } = useCompanyStore()

  // If no companies, show setup prompt
  if (!companies.length) {
    return (
      <button
        onClick={() => navigate('/setup')}
        className="w-full flex items-center justify-between px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
      >
        <div className="flex items-center gap-x-2">
          <Plus className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">Setup Company</span>
        </div>
      </button>
    )
  }

  // If no current company selected (shouldn't happen, but just in case)
  if (!currentCompany) {
    return (
      <div className="px-3 py-2 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-500">No company selected</span>
      </div>
    )
  }

  const displayText = currentFactory 
    ? `${currentCompany.name} - ${currentFactory.name}`
    : currentCompany.name

  return (
    <div className="relative">
      <Listbox
        value={currentFactory}
        onChange={(factory) => {
          if (factory) {
            setCurrentFactory(factory)
          }
        }}
      >
        <Listbox.Button className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-x-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 truncate">{displayText}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Listbox.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {companies.map((company) => (
              <div key={company.id}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {company.name}
                </div>
                {company.factories.map((factory) => (
                  <Listbox.Option
                    key={factory.id}
                    value={factory}
                    className={({ active }) =>
                      cn(
                        'cursor-pointer select-none relative py-2 pl-10 pr-4',
                        active ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                      )
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <Factory className={cn(
                            'h-4 w-4 mr-2',
                            active ? 'text-primary-600' : 'text-gray-400'
                          )} />
                          <span className={cn(
                            'block truncate',
                            selected ? 'font-medium' : 'font-normal'
                          )}>
                            {factory.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({factory.type})
                          </span>
                        </div>
                        {selected && (
                          <span className={cn(
                            'absolute inset-y-0 left-0 flex items-center pl-3',
                            active ? 'text-primary-600' : 'text-primary-600'
                          )}>
                            <ChevronDown className="h-4 w-4 rotate-270" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </div>
            ))}
            
            {/* Add new company option */}
            <div className="border-t border-gray-200 mt-1 pt-1">
              <button
                onClick={() => navigate('/setup')}
                className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Company
              </button>
            </div>
          </Listbox.Options>
        </Transition>
      </Listbox>
    </div>
  )
}