// "use client"

// import type React from "react"

// import { useEffect, useRef, useState } from "react"
// import { Card } from "@/components/ui/card"
// import { Video, VideoOff, Eye, Upload, X } from "lucide-react"
// import { Button } from "@/components/ui/button"

// type PreviewMode = "none" | "camera" | "upload"

// export function CameraPreview() {
//   const videoRef = useRef<HTMLVideoElement>(null)
//   const uploadedVideoRef = useRef<HTMLVideoElement>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)
//   const [mode, setMode] = useState<PreviewMode>("none")
//   const [error, setError] = useState<string | null>(null)
//   const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)

//   useEffect(() => {
//     if (mode === "camera" && videoRef.current) {
//       navigator.mediaDevices
//         .getUserMedia({ video: true })
//         .then((stream) => {
//           if (videoRef.current) {
//             videoRef.current.srcObject = stream
//           }
//         })
//         .catch((err) => {
//           console.error("Camera error:", err)
//           setError("Could not access camera")
//           setMode("none")
//         })
//     }

//     return () => {
//       if (videoRef.current?.srcObject) {
//         const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
//         tracks.forEach((track) => track.stop())
//       }
//     }
//   }, [mode])

//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (file) {
//       if (!file.type.startsWith("video/")) {
//         setError("Please upload a valid video file")
//         return
//       }
//       const url = URL.createObjectURL(file)
//       setUploadedVideoUrl(url)
//       setMode("upload")
//       setError(null)
//     }
//   }

//   const handleClearUpload = () => {
//     if (uploadedVideoUrl) {
//       URL.revokeObjectURL(uploadedVideoUrl)
//     }
//     setUploadedVideoUrl(null)
//     setMode("none")
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""
//     }
//   }

//   const handleDisable = () => {
//     if (mode === "upload" && uploadedVideoUrl) {
//       URL.revokeObjectURL(uploadedVideoUrl)
//       setUploadedVideoUrl(null)
//     }
//     setMode("none")
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""
//     }
//   }

//   return (
//     <Card className="flex-1 relative overflow-hidden bg-card/30 backdrop-blur-xl border-border/30">
//       {/* Hidden file input */}
//       <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />

//       {mode === "camera" ? (
//         <>
//           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl" />
//           <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
//               <Eye className="w-3.5 h-3.5 text-accent" />
//               <span className="text-xs text-muted-foreground">Focus awareness on-device</span>
//             </div>
//             <Button size="sm" variant="secondary" onClick={handleDisable} className="gap-2">
//               <VideoOff className="w-4 h-4" />
//               Disable
//             </Button>
//           </div>
//         </>
//       ) : mode === "upload" && uploadedVideoUrl ? (
//         <>
//           <video
//             ref={uploadedVideoRef}
//             src={uploadedVideoUrl}
//             controls
//             autoPlay
//             loop
//             className="w-full h-full object-contain rounded-xl bg-black"
//           />
//           <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
//             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
//               <Upload className="w-3.5 h-3.5 text-accent" />
//               <span className="text-xs text-muted-foreground">Testing with uploaded video</span>
//             </div>
//             <Button size="sm" variant="secondary" onClick={handleClearUpload} className="gap-2">
//               <X className="w-4 h-4" />
//               Remove
//             </Button>
//           </div>
//         </>
//       ) : (
//         <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
//           <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
//             <Video className="w-8 h-8 text-muted-foreground" />
//           </div>
//           <div className="text-center">
//             <p className="text-foreground font-medium mb-1">Video Input</p>
//             <p className="text-sm text-muted-foreground max-w-xs">
//               Enable your camera or upload a video for focus awareness testing.
//             </p>
//           </div>
//           {error && <p className="text-sm text-destructive">{error}</p>}
//           <div className="flex gap-3 mt-2">
//             <Button onClick={() => setMode("camera")} className="gap-2">
//               <Video className="w-4 h-4" />
//               Enable Camera
//             </Button>
//             <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
//               <Upload className="w-4 h-4" />
//               Upload Video
//             </Button>
//           </div>
//         </div>
//       )}
//     </Card>
//   )
// }

"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Video, VideoOff, Eye, Upload, X, Activity, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context";

type PreviewMode = "none" | "camera" | "upload"

interface SessionStats {
  session_id: string
  duration_seconds: number
  current_score: number
  total_violations: number
  phone_detected_count: number
  left_seat_count: number
  total_alerts: number
  focus_percentage: number
}

interface DetectionResult {
  session_id: string
  timestamp: string
  is_focused: boolean
  person_detected: boolean
  phone_detected: boolean
  confidence: number
  message: string
  alert_type: string | null
  stats: SessionStats
}

export function CameraPreview() {
  const { token } = useAuth()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const uploadedVideoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const [mode, setMode] = useState<PreviewMode>("none")
  const [error, setError] = useState<string | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  
  // AI Detection states
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [detection, setDetection] = useState<DetectionResult | null>(null)

  // Start camera
  useEffect(() => {
    if (mode === "camera" && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch((err) => {
          console.error("Camera error:", err)
          setError("Could not access camera")
          setMode("none")
        })
    }

    return () => {
      if (videoRef. current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [])

  // Create AI session
  const createSession = async (): Promise<string | null> => {
    try {
      const response = await fetch("http://localhost:8000/api/focus/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_name: "Focus Session",
          subject:  "Study",
          initial_score: 100,
        }),
      })

      if (!response.ok) throw new Error("Failed to create session")

      const data = await response.json()
      return data.session_id
    } catch (err) {
      console.error("Session creation error:", err)
      setError("Failed to create AI session")
      return null
    }
  }

  // Start AI tracking
  const startTracking = async () => {
    if (!token) {
      setError("Please login first")
      return
    }

    // Create session
    const id = await createSession()
    if (!id) return

    setSessionId(id)

    // Connect WebSocket
    const ws = new WebSocket(`ws://localhost:8000/api/focus/ws/${id}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("✅ AI Detection connected")
      setIsTracking(true)
      setError(null)
      startSendingFrames()
    }

    ws.onmessage = (event) => {
      const data:  DetectionResult = JSON.parse(event.data)
      setDetection(data)

      // Play alert if needed
      if (data.alert_type === "urgent") {
        playAlert()
      }
    }

    ws.onerror = (err) => {
      console.error("WebSocket error:", err)
      setError("AI connection error")
    }

    ws.onclose = () => {
      console.log("WebSocket closed")
      setIsTracking(false)
      stopSendingFrames()
    }
  }

  // Stop AI tracking
  const stopTracking = async () => {
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Stop sending frames
    stopSendingFrames()

    // End session
    if (sessionId && token) {
      try {
        await fetch(`http://localhost:8000/api/focus/sessions/${sessionId}/end`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "completed" }),
        })
      } catch (err) {
        console.error("Failed to end session:", err)
      }
    }

    setIsTracking(false)
    setSessionId(null)
    setDetection(null)
  }

  // Send frames to AI
  const startSendingFrames = () => {
    frameIntervalRef.current = setInterval(() => {
      sendFrame()
    }, 500) // Send frame every 500ms
  }

  const stopSendingFrames = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef. current = null
    }
  }

  const sendFrame = () => {
    if (! wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    const video = mode === "camera" ? videoRef. current : uploadedVideoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d")
      if (! ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx. drawImage(video, 0, 0)

      // Convert to base64 and send
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
        wsRef.current.send(dataUrl)
      } catch (err) {
        console.error("Failed to send frame:", err)
      }
    }
  }

  // Play alert sound
  const playAlert = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"
      gainNode.gain.value = 0.3

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (err) {
      console.error("Audio error:", err)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React. ChangeEvent<HTMLInputElement>) => {
    const file = event. target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
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
      fileInputRef.current.value = ""
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
      fileInputRef. current.value = ""
    }
  }

  // Toggle tracking
  const toggleTracking = () => {
    if (isTracking) {
      stopTracking()
    } else {
      startTracking()
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex-1 relative overflow-hidden bg-card/30 backdrop-blur-xl border-border/30">
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />

        {mode === "camera" ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl" />
            
            {/* AI Detection Overlay */}
            {detection && (
              <div className="absolute top-4 left-4 right-4">
                <div
                  className={`px-4 py-2 rounded-lg backdrop-blur-md ${
                    detection.is_focused
                      ? "bg-green-500/80 text-white"
                      : "bg-red-500/80 text-white"
                  }`}
                >
                  <p className="font-semibold">{detection.message}</p>
                  <p className="text-xs opacity-90">
                    Confidence: {(detection.confidence * 100).toFixed(1)}% | 
                    Score: {detection.stats.current_score. toFixed(1)}
                  </p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                {isTracking ?  (
                  <>
                    <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">AI Detecting...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs text-muted-foreground">Ready</span>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                {token ? (
                  <Button
                    size="sm"
                    variant={isTracking ? "destructive" : "default"}
                    onClick={toggleTracking}
                    className="gap-2"
                  >
                    {isTracking ? (
                      <>
                        <VideoOff className="w-4 h-4" />
                        Stop AI
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        Start AI
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
            
            {/* AI Detection Overlay */}
            {detection && (
              <div className="absolute top-4 left-4 right-4">
                <div
                  className={`px-4 py-2 rounded-lg backdrop-blur-md ${
                    detection. is_focused ?  "bg-green-500/80" : "bg-red-500/80"
                  } text-white`}
                >
                  <p className="font-semibold">{detection. message}</p>
                  <p className="text-xs opacity-90">
                    Confidence:  {(detection.confidence * 100).toFixed(1)}%
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
                {token && (
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
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Video
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Card */}
      {detection && (
        <Card className="p-6 bg-card/30 backdrop-blur-xl border-border/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Session Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem
              label="Duration"
              value={formatDuration(detection.stats.duration_seconds)}
            />
            <StatItem
              label="Score"
              value={detection.stats.current_score. toFixed(1)}
              className="text-green-600"
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
              <span className={detection.person_detected ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {detection.person_detected ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// Helper component
function StatItem({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
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
  return `${mins}:${secs.toString().padStart(2, "0")}`
}