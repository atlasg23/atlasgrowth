'use client'
import { useState, useEffect } from 'react'
import { Business } from '@/types/business'

interface Message {
  id: string
  to: string
  from: string
  body: string
  direction: 'inbound' | 'outbound'
  timestamp: Date
  status: 'sent' | 'delivered' | 'failed'
  business?: Business
}

interface Conversation {
  phoneNumber: string
  contact?: {
    name: string
    business?: Business
  }
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showQuickSend, setShowQuickSend] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    try {
      const response = await fetch('/api/messages/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(phoneNumber: string, message: string, business?: Business) {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          business: business ? {
            name: business.name,
            niche: business.niche
          } : undefined
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Refresh conversations to show new message
        await loadConversations()
        setNewMessage('')
        
        // If this creates a new conversation, select it
        if (!selectedConversation) {
          const newConv = conversations.find(c => c.phoneNumber === phoneNumber)
          if (newConv) setSelectedConversation(newConv)
        }
      } else {
        alert('Failed to send message: ' + result.error)
      }
    } catch (error) {
      console.error('Send message error:', error)
      alert('Failed to send message')
    }
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <button
              onClick={() => setShowQuickSend(!showQuickSend)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Quick Send
            </button>
          </div>
          
          {/* Quick Send Panel */}
          {showQuickSend && (
            <QuickSendPanel
              onSend={(phone, message, business) => {
                sendMessage(phone, message, business)
                setShowQuickSend(false)
              }}
              onClose={() => setShowQuickSend(false)}
            />
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Use Quick Send to start messaging.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.phoneNumber}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.phoneNumber === conv.phoneNumber ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-gray-900">
                    {conv.contact?.name || formatPhone(conv.phoneNumber)}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {conv.lastMessage.body}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTime(conv.lastMessage.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Message Thread */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-lg">
                {selectedConversation.contact?.name || formatPhone(selectedConversation.phoneNumber)}
              </h3>
              {selectedConversation.contact?.business && (
                <p className="text-sm text-gray-600">
                  {selectedConversation.contact.business.name} - {selectedConversation.contact.business.niche}
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.direction === 'outbound'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {formatTime(message.timestamp)}
                      {message.direction === 'outbound' && (
                        <span className="ml-2">
                          {message.status === 'sent' && '✓'}
                          {message.status === 'delivered' && '✓✓'}
                          {message.status === 'failed' && '❌'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (newMessage.trim()) {
                        sendMessage(selectedConversation.phoneNumber, newMessage.trim())
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newMessage.trim()) {
                      sendMessage(selectedConversation.phoneNumber, newMessage.trim())
                    }
                  }}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  )
}

// Quick Send Component
function QuickSendPanel({ onSend, onClose }: {
  onSend: (phone: string, message: string, business?: Business) => void
  onClose: () => void
}) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadBusinesses()
  }, [])

  async function loadBusinesses() {
    try {
      const response = await fetch('/api/businesses')
      const data = await response.json()
      setBusinesses(data.businesses || [])
    } catch (error) {
      console.error('Failed to load businesses:', error)
    }
  }

  const filteredBusinesses = businesses.filter(b =>
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone?.includes(searchTerm)
  )

  const generateDemoMessage = (business: Business) => {
    return `Hi ${business.name ? business.name.split(' ')[0] : 'there'}! 

I noticed your ${business.niche?.toLowerCase()} business and wanted to reach out about potentially helping you get more customers online.

This could help your business:
• Get more phone calls
• Rank higher on Google 
• Look more professional than competitors

Would you like to see how this could work for your business? Just reply YES and I'll walk you through it.

Best regards!`
  }

  return (
    <div className="absolute top-16 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Quick Send Message</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Business Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Find Business (Optional)</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
        
        {searchTerm && filteredBusinesses.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded max-h-32 overflow-y-auto">
            {filteredBusinesses.slice(0, 5).map(business => (
              <div
                key={business.id}
                onClick={() => {
                  setSelectedBusiness(business)
                  setPhoneNumber(business.phone || '')
                  setMessage(generateDemoMessage(business))
                  setSearchTerm('')
                }}
                className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm">{business.name}</div>
                <div className="text-xs text-gray-600">{business.phone} • {business.niche}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Business */}
      {selectedBusiness && (
        <div className="mb-4 p-2 bg-blue-50 rounded border">
          <div className="text-sm font-medium">{selectedBusiness.name}</div>
          <div className="text-xs text-gray-600">{selectedBusiness.niche}</div>
          <button
            onClick={() => {
              setSelectedBusiness(null)
              setPhoneNumber('')
              setMessage('')
            }}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Manual Phone Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Phone Number</label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          className="w-full p-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* Message */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={() => {
          if (phoneNumber && message) {
            onSend(phoneNumber, message, selectedBusiness || undefined)
          }
        }}
        disabled={!phoneNumber || !message}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send Message & Create GHL Contact
      </button>
    </div>
  )
}