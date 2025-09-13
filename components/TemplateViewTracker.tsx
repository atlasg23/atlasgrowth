'use client'
import { useEffect, useRef, useState } from 'react'

interface TemplateViewTrackerProps {
  businessSlug: string
  templateType: string
}

export default function TemplateViewTracker({ businessSlug, templateType }: TemplateViewTrackerProps) {
  const [viewId, setViewId] = useState<string | null>(null)
  const startTime = useRef<number>(Date.now())
  const interactionCount = useRef<number>(0)
  
  // Generate a session ID for this visitor
  const getSessionId = () => {
    const stored = sessionStorage.getItem('template_session_id')
    if (stored) return stored
    
    // Create fingerprint from browser data
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width + 'x' + screen.height,
      Math.random().toString(36)
    ].join('|')
    
    const sessionId = btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
    sessionStorage.setItem('template_session_id', sessionId)
    return sessionId
  }

  useEffect(() => {
    // Track the template view
    const trackView = async () => {
      try {
        const visitorInfo = {
          business_slug: businessSlug,
          template_type: templateType,
          user_agent: navigator.userAgent,
          referrer: document.referrer || '',
          session_id: getSessionId(),
          page_loaded_at: new Date().toISOString()
        }

        console.log('📊 Tracking template view:', visitorInfo)

        const response = await fetch('/api/track-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(visitorInfo)
        })

        const data = await response.json()
        if (data.view_id) {
          setViewId(data.view_id)
        }

        console.log('✅ Template view tracked:', data.is_unique ? 'Unique visitor' : 'Returning visitor')
      } catch (error) {
        console.error('❌ Failed to track template view:', error)
      }
    }

    // Track immediately (no delay)
    trackView()

    // Track interactions
    const trackInteraction = () => {
      interactionCount.current++
    }

    // Add event listeners for interactions
    document.addEventListener('click', trackInteraction)
    document.addEventListener('scroll', trackInteraction, { once: true })

    // Track duration when leaving
    const trackDuration = async () => {
      if (!viewId) return
      
      const duration = Math.floor((Date.now() - startTime.current) / 1000)
      
      // Use sendBeacon for reliability when page unloads
      const payload = JSON.stringify({
        view_id: viewId,
        duration_seconds: duration,
        interactions: interactionCount.current
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track-duration', payload)
      } else {
        // Fallback for older browsers
        fetch('/api/track-duration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        })
      }
    }

    // Track when page is hidden/unloaded
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackDuration()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', trackDuration)

    return () => {
      document.removeEventListener('click', trackInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', trackDuration)
    }
  }, [businessSlug, templateType, viewId])

  // This component renders nothing
  return null
}