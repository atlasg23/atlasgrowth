'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Messages', href: '/dashboard/messages', icon: '💬' },
  { name: 'Contacts', href: '/dashboard/contacts', icon: '👥' },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: '📢' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales Platform</h1>
              <p className="text-gray-600 mt-1">Lead generation and messaging platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                TextGrid: <span className="text-green-600 font-medium">Connected</span>
              </div>
              <div className="text-sm text-gray-600">
                GHL: <span className="text-green-600 font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || 
                (tab.href !== '/dashboard' && pathname?.startsWith(tab.href))
              
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}