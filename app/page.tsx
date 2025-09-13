import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Business Directory System</h1>
        
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            🚀 Sales Dashboard
          </Link>
          
          <p className="text-gray-600 text-sm">
            Manage your plumber and HVAC contractor leads
          </p>
        </div>
      </div>
    </div>
  )
}