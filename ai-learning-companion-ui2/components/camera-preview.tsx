"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Video, VideoOff, Eye, Upload, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFocusMonitoring } from "@/hooks/use-focus-monitoring"
import { Badge } from "@/components/ui/badge"

type PreviewMode = "none" | "camera" | "upload"

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const uploadedVideoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [mode, setMode] = useState<PreviewMode>("none")
  const [error, setError] = useState<string | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  
  // Focus monitoring hook
  const { isConnected, focusData, error: focusError, sendFrame, connect, disconnect } = useFocusMonitoring()

  useEffect(() => {
    if (mode === "camera" && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            // Connect to focus monitoring service
            connect()
          }
        })
        .catch((err) => {
          console.error("Camera error:", err)
          setError("Could not access camera")
          setMode("none")
        })
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
      disconnect()
    }
  }, [mode, connect, disconnect])
  
  // Separate effect for frame sending - only send frames when connected
  useEffect(() => {
    if (mode === "camera" && isConnected && videoRef.current) {
      // Start sending frames for analysis every 500ms
      frameIntervalRef.current = setInterval(() => {
        if (videoRef.current && isConnected) {
          sendFrame(videoRef.current)
        }
      }, 500)
      
      return () => {
        if (frameIntervalRef.current) {
          clearInterval(frameIntervalRef.current)
        }
      }
    }
  }, [mode, isConnected, sendFrame])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
    if (mode === "upload" && uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl)
      setUploadedVideoUrl(null)
    }
    setMode("none")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="flex-1 relative overflow-hidden bg-card/30 backdrop-blur-xl border-border/30">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />

      {mode === "camera" ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl" />
          
          {/* Focus status overlay */}
          {focusData && (
            <div className="absolute top-4 left-4 right-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={focusData.focused ? "default" : "destructive"}
                  className="text-sm font-semibold"
                >
                  {focusData.focused ? "✓ Focused" : "✗ Not Focused"}
                </Badge>
                {!isConnected && (
                  <Badge variant="outline" className="text-xs">
                    Connecting...
                  </Badge>
                )}
              </div>
              
              {!focusData.focused && focusData.focus_reasons.length > 0 && (
                <div className="bg-destructive/10 backdrop-blur-sm rounded-lg p-2 border border-destructive/20">
                  <p className="text-xs text-destructive font-medium">{focusData.focus_reasons[0]}</p>
                </div>
              )}
              
              {focusData.head_pose.yaw !== null && focusData.head_pose.pitch !== null && (
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs">
                  <span className="text-muted-foreground">
                    Yaw: {focusData.head_pose.yaw.toFixed(1)}° | Pitch: {focusData.head_pose.pitch.toFixed(1)}°
                  </span>
                </div>
              )}
            </div>
          )}
          
          {focusError && (
            <div className="absolute top-4 left-4 right-4 bg-destructive/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive-foreground" />
              <span className="text-sm text-destructive-foreground">{focusError}</span>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
              <Eye className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">
                Focus awareness {isConnected ? "active" : "connecting..."}
              </span>
            </div>
            <Button size="sm" variant="secondary" onClick={handleDisable} className="gap-2">
              <VideoOff className="w-4 h-4" />
              Disable
            </Button>
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
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
              <Upload className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-muted-foreground">Testing with uploaded video</span>
            </div>
            <Button size="sm" variant="secondary" onClick={handleClearUpload} className="gap-2">
              <X className="w-4 h-4" />
              Remove
            </Button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium mb-1">Video Input</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Enable your camera or upload a video for focus awareness testing.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
  )
}
