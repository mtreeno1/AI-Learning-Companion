"use client"

import { useRef, useCallback, useEffect, useState } from 'react'
import { API_CONFIG } from '@/lib/api-config'

export interface FocusData {
  focused: boolean
  phone_detected: boolean
  phone_info: {
    bbox: number[]
    confidence: number
    label: string
  } | null
  head_pose: {
    yaw: number | null
    pitch: number | null
  }
  keypoints: number[][] | null
  focus_reasons: string[]
}

export interface UseFocusMonitoringResult {
  isConnected: boolean
  focusData: FocusData | null
  error: string | null
  sendFrame: (videoElement: HTMLVideoElement) => void
  connect: () => void
  disconnect: () => void
}

/**
 * Hook to connect to the focus monitoring WebSocket service
 * and send video frames for real-time analysis
 */
export function useFocusMonitoring(): UseFocusMonitoringResult {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [focusData, setFocusData] = useState<FocusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Initialize canvas for frame capture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      canvasRef.current = document.createElement('canvas')
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current = null
      }
    }
  }, [])

  const connect = useCallback(() => {
    try {
      const wsUrl = `${API_CONFIG.WS_URL}${API_CONFIG.ENDPOINTS.WS_FOCUS}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected to focus monitoring service')
        setIsConnected(true)
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data)
          if (response.success && response.data) {
            setFocusData(response.data)
          } else if (response.error) {
            setError(response.error)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('WebSocket connection error')
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err)
      setError('Failed to connect to focus monitoring service')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setIsConnected(false)
      setFocusData(null)
    }
  }, [])

  const sendFrame = useCallback((videoElement: HTMLVideoElement) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    if (!canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const video = videoElement

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to base64 image
    canvas.toBlob((blob) => {
      if (!blob) return

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64data = reader.result as string
        
        // Send to WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            image: base64data
          }))
        }
      }
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.8)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    focusData,
    error,
    sendFrame,
    connect,
    disconnect
  }
}
