// TextGrid SMS API Integration
const TEXTGRID_BASE_URL = 'https://api.textgrid.com/v1'

export interface SendSMSOptions {
  to: string
  message: string
  from?: string
}

export interface SMSMessage {
  id: string
  to: string
  from: string
  body: string
  direction: 'inbound' | 'outbound'
  timestamp: Date
  status: 'sent' | 'delivered' | 'failed' | 'pending'
}

export class TextGridAPI {
  private accountSid: string
  private authToken: string
  private defaultFrom: string

  constructor() {
    this.accountSid = process.env.TEXTGRID_ACCOUNT_SID!
    this.authToken = process.env.TEXTGRID_AUTH_TOKEN!
    this.defaultFrom = process.env.TEXTGRID_PHONE_1! // Use first TextGrid number as default
  }

  private getAuthHeader() {
    const credentials = `${this.accountSid}:${this.authToken}`
    return `Basic ${Buffer.from(credentials).toString('base64')}`
  }

  async sendSMS(options: SendSMSOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${TEXTGRID_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.formatPhoneNumber(options.to),
          from: options.from || this.defaultFrom,
          body: options.message
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        return {
          success: true,
          messageId: data.id || data.message_id
        }
      } else {
        return {
          success: false,
          error: data.error || data.message || 'Failed to send SMS'
        }
      }
    } catch (error) {
      console.error('TextGrid API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  async getMessages(limit: number = 50): Promise<SMSMessage[]> {
    try {
      const response = await fetch(`${TEXTGRID_BASE_URL}/messages?limit=${limit}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      })

      const data = await response.json()
      
      if (response.ok && data.messages) {
        return data.messages.map((msg: any) => ({
          id: msg.id || msg.message_id,
          to: msg.to,
          from: msg.from,
          body: msg.body,
          direction: msg.direction || (msg.from === this.defaultFrom ? 'outbound' : 'inbound'),
          timestamp: new Date(msg.created_at || msg.timestamp),
          status: msg.status || 'delivered'
        }))
      }

      return []
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      return []
    }
  }

  async getConversations(): Promise<any[]> {
    try {
      // Get recent messages and group by phone number
      const messages = await this.getMessages(200)
      const conversationMap = new Map()

      messages.forEach(msg => {
        const phoneNumber = msg.direction === 'outbound' ? msg.to : msg.from
        
        if (!conversationMap.has(phoneNumber)) {
          conversationMap.set(phoneNumber, {
            phoneNumber,
            messages: [],
            lastMessage: msg,
            unreadCount: 0
          })
        }

        const conversation = conversationMap.get(phoneNumber)
        conversation.messages.push(msg)
        
        // Update last message if this one is newer
        if (msg.timestamp > conversation.lastMessage.timestamp) {
          conversation.lastMessage = msg
        }

        // Count unread (inbound messages - simplified logic)
        if (msg.direction === 'inbound') {
          conversation.unreadCount++
        }
      })

      // Sort conversations by last message time
      const conversations = Array.from(conversationMap.values())
      conversations.sort((a, b) => 
        b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
      )

      // Sort messages within each conversation
      conversations.forEach(conv => {
        conv.messages.sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime())
      })

      return conversations
    } catch (error) {
      console.error('Failed to get conversations:', error)
      return []
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add +1 if it's a 10-digit US number
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    
    // Add + if it's missing
    if (cleaned.length === 11 && !phone.startsWith('+')) {
      return `+${cleaned}`
    }
    
    return phone
  }

  // Method to handle webhook verification
  static verifyWebhook(signature: string, body: string, secret: string): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    
    return signature === expectedSignature
  }
}

// Singleton instance
export const textGrid = new TextGridAPI()