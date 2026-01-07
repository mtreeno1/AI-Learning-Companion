"use client"

import type React from "react"
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { Card } from "@/components/ui/card"
import { Video, VideoOff, Eye, Upload, X, Activity, AlertCircle, Circle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

type PreviewMode = "none" | "camera" | "upload"

interface SessionStats {
  session_id: string
  duration_seconds: number
  current_score: number
  total_violations: number
  phone_detected_count: number
  left_seat_count: number
  total_alerts: number
  gentle_alerts: number
  urgent_alerts: number
  focus_percentage: number
  total_frames: number
  focused_frames: number
}

interface RecordingStatus {
  enabled: boolean
  active: boolean
}

interface DetectionResult {
  session_id: string
  timestamp: string
  is_focused: boolean
  person_detected: boolean
  person_confidence?:  number
  phone_detected:  boolean
  confidence: number
  message: string
  alert_type: string | null
  violation_type?:  string | null
  consecutive_violations?: number
  recording?: RecordingStatus
  stats:  SessionStats
}

export interface CameraPreviewRef {
  startAI: () => Promise<void>
  stopAI: () => Promise<void>
  isAIActive: () => boolean
}

interface CameraPreviewProps {
  isTimerRunning?:  boolean
  onAIStart?: () => void
  onAIStop?: () => void
  autoStartWithTimer?: boolean  // ✅ Tự động start AI khi timer start
  enableRecording?: boolean  // ✅ Enable backend video recording
}

export const CameraPreview = forwardRef<CameraPreviewRef, CameraPreviewProps>(
  ({ isTimerRunning = false, onAIStart, onAIStop, autoStartWithTimer = true, enableRecording = false }, ref) => {
    const { user } = useAuth()

    const videoRef = useRef<HTMLVideoElement>(null)
    const uploadedVideoRef = useRef<HTMLVideoElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const keepaliveIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [mode, setMode] = useState<PreviewMode>("none")
    const [error, setError] = useState<string | null>(null)
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)

    // AI Detection states
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isTracking, setIsTracking] = useState(false)
    const [detection, setDetection] = useState<DetectionResult | null>(null)
    const [isReconnecting, setIsReconnecting] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false) // ✅ Track if frame is being processed
    
    // Recording states
    const [isRecording, setIsRecording] = useState(false)
    const [recordingId, setRecordingId] = useState<string | null>(null)
    
    // Performance tracking
    const [avgLatency, setAvgLatency] = useState<number>(0)
    const latencyHistoryRef = useRef<number[]>([])
    const frameTimestampRef = useRef<number>(0)

    // ✅ Auto start/stop AI when timer changes
    useEffect(() => {
      if (! autoStartWithTimer) return

      if (isTimerRunning && mode !== "none" && !isTracking && user?.token) {
        console.log("⏰ Timer started -> Auto starting AI")
        startTracking()
      } else if (!isTimerRunning && isTracking) {
        console.log("⏰ Timer stopped -> Auto stopping AI")
        stopTracking()
      }
    }, [isTimerRunning, autoStartWithTimer])

    // Start camera
    useEffect(() => {
      if (mode === "camera" && videoRef.current) {
        navigator.mediaDevices
          .getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            } 
          })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream
            }
          })
          .catch((err) => {
            console.error("Camera error:", err)
            setError("Could not access camera.  Please check permissions.")
            setMode("none")
          })
      }

      return () => {
        if (videoRef.current?. srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
          tracks.forEach((track) => track.stop())
        }
      }
    }, [mode])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        cleanupAll()
      }
    }, [])

    // Cleanup all resources
    const cleanupAll = useCallback(() => {
      stopTracking()
      
      if (keepaliveIntervalRef.current) {
        clearInterval(keepaliveIntervalRef.current)
        keepaliveIntervalRef.current = null
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // ✅ Reset processing state
      setIsProcessing(false)
      frameTimestampRef.current = 0
    }, [])

    // Create AI session
    const createSession = async (): Promise<string | null> => {
      try {
        if (!user?.token) {
          throw new Error("No authentication token")
        }

        console.log("Creating session...")
        const response = await fetch("http://localhost:8000/api/focus/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_name: "Focus Session",
            subject:  "Study",
            initial_score: 100,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create session: ${response.status} ${errorText}`)
        }

        const data = await response. json()
        console.log("✅ Session created:", data. session_id)
        return data.session_id
      } catch (err) {
        console.error("Session creation error:", err)
        setError(`Failed to create AI session: ${err instanceof Error ? err.message : 'Unknown error'}`)
        return null
      }
    }

    // Start recording
    const startRecording = useCallback(async () => {
      if (!sessionId || !user?.token) {
        console.error("No session or token for recording")
        return
      }

      try {
        console.log("🎥 Starting video recording...")
        const response = await fetch(
          `http://localhost:8000/api/recordings/sessions/${sessionId}/start?fps=30&resolution=1920x1080`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to start recording: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        setRecordingId(data.recording_id)
        setIsRecording(true)
        console.log("✅ Recording started:", data.recording_id)
      } catch (err) {
        console.error("Recording start error:", err)
        setError(`Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }, [sessionId, user])

    // Stop recording
    const stopRecording = useCallback(async () => {
      if (!sessionId || !user?.token || !isRecording) {
        return
      }

      try {
        console.log("🛑 Stopping video recording...")
        const response = await fetch(
          `http://localhost:8000/api/recordings/sessions/${sessionId}/stop`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to stop recording: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        console.log("✅ Recording stopped:", data)
        setIsRecording(false)
        setRecordingId(null)
      } catch (err) {
        console.error("Recording stop error:", err)
      }
    }, [sessionId, user, isRecording])

    // Start AI tracking
    const startTracking = useCallback(async () => {
      if (!user?.token) {
        setError("Please login first")
        return
      }

      if (mode === "none") {
        setError("Please enable camera or upload video first")
        return
      }

      if (isTracking) {
        console.log("AI already tracking")
        return
      }

      console.log("🚀 Starting AI tracking...")
      
      const id = await createSession()
      if (!id) return

      setSessionId(id)
      
      // Start recording if enabled
      if (enableRecording) {
        // Wait a bit for session to be fully created
        setTimeout(() => {
          startRecording()
        }, 500)
      }

      const wsUrl = enableRecording 
        ? `ws://localhost:8000/api/focus/ws/${id}?enable_recording=true`
        : `ws://localhost:8000/api/focus/ws/${id}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("✅ AI Detection WebSocket connected")
        setIsTracking(true)
        setIsReconnecting(false)
        setError(null)
        
        startSendingFrames()
        
        // ✅ Start keepalive ping
        keepaliveIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket. OPEN) {
            ws.send(JSON.stringify({ type: "ping" }))
          }
        }, 30000) // Every 30 seconds
        
        onAIStart?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON. parse(event.data)
          
          // Handle pong
          if (data.type === "pong") {
            console.log("🏓 Pong received")
            return
          }
          
          // Handle error
          if (data.error) {
            console.error("AI Error:", data.error)
            setError(data.error)
            setIsProcessing(false) // ✅ Allow retry on error
            return
          }
          
          // ✅ Calculate latency
          if (frameTimestampRef.current > 0) {
            const latency = Date.now() - frameTimestampRef.current
            latencyHistoryRef.current.push(latency)
            if (latencyHistoryRef.current.length > 10) {
              latencyHistoryRef.current.shift() // Keep last 10 only
            }
            const avg = latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length
            setAvgLatency(Math.round(avg))
            
            // ✅ Log slow responses
            if (latency > 2000) {
              console.warn(`⚠️ Slow response: ${latency}ms`)
            }
          }
          
          // Handle detection result
          const result:  DetectionResult = data
          setDetection(result)
          
          // ✅ Mark processing complete and send next frame
          setIsProcessing(false)
          
          // ✅ Use requestAnimationFrame for smooth frame sending
          requestAnimationFrame(() => {
            sendFrame()
          })

          // Play alert for urgent violations
          if (result.alert_type === "urgent" || result.alert_type === "critical") {
            playAlert(result. alert_type === "critical")
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err)
          setIsProcessing(false) // ✅ Allow retry on parse error
        }
      }

      ws. onerror = (err) => {
        console.error("❌ WebSocket error:", err)
        setError("AI connection error")
      }

      ws.onclose = (event) => {
        console. log("🔌 WebSocket closed:", event.code, event.reason)
        setIsTracking(false)
        stopSendingFrames()
        
        // Clear keepalive
        if (keepaliveIntervalRef.current) {
          clearInterval(keepaliveIntervalRef.current)
          keepaliveIntervalRef.current = null
        }

        // ✅ Auto-reconnect if not intentional close and timer is running
        if (event.code !== 1000 && isTimerRunning && autoStartWithTimer && !isReconnecting) {
          console.log("🔄 Reconnecting in 3 seconds...")
          setIsReconnecting(true)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (sessionId && isTimerRunning) {
              startTracking()
            }
          }, 3000)
        }
      }
    }, [user, mode, isTracking, isTimerRunning, autoStartWithTimer, onAIStart, enableRecording, startRecording])

    // Stop AI tracking
    const stopTracking = useCallback(async () => {
      console.log("🛑 Stopping AI tracking...")
      
      // Stop recording first if active
      if (isRecording) {
        await stopRecording()
      }
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      setIsReconnecting(false)

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close(1000, "User stopped tracking")
        wsRef.current = null
      }

      // Stop sending frames
      stopSendingFrames()
      
      // Clear keepalive
      if (keepaliveIntervalRef.current) {
        clearInterval(keepaliveIntervalRef.current)
        keepaliveIntervalRef.current = null
      }

      // End session
      if (sessionId && user?.token) {
        try {
          console.log(`Ending session: ${sessionId}`)

          const response = await fetch(
            `http://localhost:8000/api/focus/sessions/${sessionId}/end`,
            {
              method: "POST",
              headers: {
                Authorization:  `Bearer ${user.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "completed" }),
            }
          )

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Failed to end session: ${response. status}`, errorText)
          } else {
            const data = await response.json()
            console.log("✅ Session ended successfully:", data)
          }
        } catch (err) {
          console.error("Failed to end session:", err)
        }
      }

      setIsTracking(false)
      setSessionId(null)
      setDetection(null)
      
      onAIStop?.()
    }, [sessionId, user, onAIStop, isRecording, stopRecording])

    // Send frames to AI
    const startSendingFrames = () => {
      // ✅ Adaptive frame rate - send first frame to start the chain
      setIsProcessing(false)
      sendFrame()
    }

    const stopSendingFrames = () => {
      // ✅ Clean up - no interval to clear anymore
      setIsProcessing(false)
      frameTimestampRef.current = 0
    }

    const sendFrame = () => {
      // ✅ Don't send if already processing previous frame
      if (isProcessing) {
        console.log("⏳ Skipping frame - still processing previous")
        return
      }
      
      if (! wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

      const video = mode === "camera" ? videoRef. current : uploadedVideoRef.current
      const canvas = canvasRef.current

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // ✅ Aggressive resolution reduction for maximum speed (320x240)
        canvas.width = 320
        canvas.height = 240
        ctx.drawImage(video, 0, 0, 320, 240)

        try {
          setIsProcessing(true) // ✅ Mark as processing
          frameTimestampRef.current = Date.now() // ✅ Track send time for latency
          
          // ✅ Very low JPEG quality for maximum speed (0.5 instead of 0.7)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.5)
          wsRef.current.send(dataUrl)
        } catch (err) {
          console.error("Failed to send frame:", err)
          setIsProcessing(false) // ✅ Reset on error
        }
      } else {
        // ✅ If no frame ready, reset and try again
        setIsProcessing(false)
      }
    }

    // Play alert sound
    const playAlert = (isCritical = false) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = isCritical ?  1000 : 800
        oscillator.type = "sine"
        gainNode.gain.value = isCritical ? 0.5 : 0.3

        oscillator.start()
        oscillator.stop(audioContext.currentTime + (isCritical ? 0.3 : 0.2))
      } catch (err) {
        console.error("Audio error:", err)
      }
    }

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        if (! file.type.startsWith("video/")) {
          setError("Please upload a valid video file")
          return
        }
        const url = URL.createObjectURL(file)
        setUploadedVideoUrl(url)
        setMode("upload")
        setError(null)
      }
    }

    const handleClearUpload = () => {
      stopTracking()
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
      }
      setUploadedVideoUrl(null)
      setMode("none")
      if (fileInputRef.current) {
        fileInputRef.current. value = ""
      }
    }

    const handleDisable = () => {
      stopTracking()
      if (mode === "upload" && uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
        setUploadedVideoUrl(null)
      }
      setMode("none")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    const toggleTracking = () => {
      if (isTracking) {
        stopTracking()
      } else {
        startTracking()
      }
    }

    // ✅ Expose methods via ref
    useImperativeHandle(ref, () => ({
      startAI:  startTracking,
      stopAI: stopTracking,
      isAIActive: () => isTracking,
    }))

    return (
      <div className="flex flex-col gap-4 h-full min-h-[400px]">
        <Card className="relative flex-1 overflow-hidden bg-card/30 backdrop-blur-xl border-border/30">
          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {mode === "camera" ?  (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-xl"
              />

              {detection && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div
                    className={`px-4 py-2 rounded-lg backdrop-blur-md transition-all ${
                      detection.alert_type === "critical"
                        ? "bg-red-600/90 text-white animate-pulse"
                        : detection.alert_type === "urgent"
                        ? "bg-orange-500/90 text-white"
                        : detection.is_focused
                        ? "bg-green-500/80 text-white"
                        : "bg-yellow-500/80 text-white"
                    }`}
                  >
                    <p className="font-semibold">{detection.message}</p>
                    <div className="flex justify-between text-xs opacity-90 mt-1">
                      <span>Confidence: {(detection.confidence * 100).toFixed(1)}%</span>
                      <span>Score: {detection.stats.current_score. toFixed(1)}</span>
                      {avgLatency > 0 && (
                        <span className={avgLatency > 1000 ? "text-red-200" : avgLatency > 500 ? "text-yellow-200" : ""}>
                          Latency: {avgLatency}ms
                        </span>
                      )}
                      {detection.consecutive_violations && detection.consecutive_violations > 0 && (
                        <span className="text-red-200">
                          Violations: {detection.consecutive_violations}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isReconnecting && (
                <div className="absolute top-20 left-4 right-4 z-10">
                  <div className="px-4 py-2 rounded-lg backdrop-blur-md bg-blue-500/80 text-white">
                    <p className="text-sm">🔄 Reconnecting to AI service...</p>
                  </div>
                </div>
              )}
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md bg-red-600/90 text-white">
                    <Circle className="w-3 h-3 fill-white animate-pulse" />
                    <span className="text-sm font-semibold">Recording</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                  {isTracking ?  (
                    <>
                      <Activity className="w-3. 5 h-3.5 text-green-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">
                        {isTimerRunning ? "AI Active - Timer Running" : "AI Detecting..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs text-muted-foreground">
                        {isTimerRunning ? "Start AI to track focus" : "Ready"}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {user?.token ?  (
                    <Button
                      size="sm"
                      variant={isTracking ? "destructive" : "default"}
                      onClick={toggleTracking}
                      className="gap-2"
                      disabled={isReconnecting}
                    >
                      {isTracking ? (
                        <>
                          <VideoOff className="w-4 h-4" />
                          Stop AI
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          {isTimerRunning ? "Resume AI" : "Start AI"}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded-full">
                      Login to use AI
                    </div>
                  )}

                  <Button size="sm" variant="secondary" onClick={handleDisable} className="gap-2">
                    <VideoOff className="w-4 h-4" />
                    Disable
                  </Button>
                </div>
              </div>
            </>
          ) : mode === "upload" && uploadedVideoUrl ? (
            <>
              <video
                ref={uploadedVideoRef}
                src={uploadedVideoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain rounded-xl bg-black"
              />

              {detection && (
                <div className="absolute top-4 left-4 right-4 z-10">
                  <div
                    className={`px-4 py-2 rounded-lg backdrop-blur-md ${
                      detection.is_focused ?  "bg-green-500/80" : "bg-red-500/80"
                    } text-white`}
                  >
                    <p className="font-semibold">{detection.message}</p>
                    <p className="text-xs opacity-90">
                      Confidence: {(detection.confidence * 100).toFixed(1)}% | Score:{" "}
                      {detection.stats.current_score.toFixed(1)}
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                  {isTracking ? (
                    <>
                      <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">AI Testing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs text-muted-foreground">Uploaded video</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {user?.token && (
                    <Button
                      size="sm"
                      variant={isTracking ? "destructive" : "default"}
                      onClick={toggleTracking}
                      className="gap-2"
                    >
                      {isTracking ? "Stop AI" : "Start AI"}
                    </Button>
                  )}

                  <Button size="sm" variant="secondary" onClick={handleClearUpload} className="gap-2">
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-foreground font-medium mb-1">AI Focus Detection</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Enable your camera or upload a video for real-time AI focus tracking. 
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <Button onClick={() => setMode("camera")} className="gap-2">
                  <Video className="w-4 h-4" />
                  Enable Camera
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Video
                </Button>
              </div>
            </div>
          )}
        </Card>

        {detection && (
          <Card className="p-6 bg-card/30 backdrop-blur-xl border-border/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Session Statistics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Duration" value={formatDuration(detection.stats.duration_seconds)} />
              <StatItem
                label="Score"
                value={detection.stats.current_score.toFixed(1)}
                className={
                  detection.stats.current_score >= 80
                    ? "text-green-600"
                    : detection. stats.current_score >= 50
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              />
              <StatItem
                label="Focus"
                value={`${detection.stats.focus_percentage.toFixed(1)}%`}
                className="text-blue-600"
              />
              <StatItem
                label="Violations"
                value={detection.stats.total_violations}
                className="text-red-600"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone detected: </span>
                <span className="font-semibold">{detection.stats. phone_detected_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Left seat:</span>
                <span className="font-semibold">{detection.stats.left_seat_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total alerts:</span>
                <span className="font-semibold">{detection.stats.total_alerts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Person detected:</span>
                <span
                  className={
                    detection.person_detected
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {detection.person_detected ?  "Yes" : "No"}
                </span>
              </div>
            </div>

            {detection.person_confidence !== undefined && (
              <div className="mt-2 text-xs text-muted-foreground">
                Person confidence: {(detection.person_confidence * 100).toFixed(1)}%
              </div>
            )}
            
            {/* Recording status and download */}
            {enableRecording && (
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <>
                        <Circle className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
                        <span className="text-sm font-semibold text-red-600">Recording in progress</span>
                      </>
                    ) : recordingId ? (
                      <>
                        <Circle className="w-4 h-4 fill-green-500 text-green-500" />
                        <span className="text-sm text-muted-foreground">Recording saved</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">No recording</span>
                      </>
                    )}
                  </div>
                  
                  {recordingId && !isRecording && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(`http://localhost:8000/api/recordings/${recordingId}/download`, '_blank')
                      }}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Recording
                    </Button>
                  )}
                </div>
              </div>
            )}
            )}
          </Card>
        )}
      </div>
    )
  }
)

CameraPreview.displayName = "CameraPreview"

// Helper component
function StatItem({
  label,
  value,
  className = "",
}: {
  label: string
  value: string | number
  className?:  string
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${className}`}>{value}</p>
    </div>
  )
}

// Format duration helper
function formatDuration(seconds:  number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs. toString().padStart(2, "0")}`
}