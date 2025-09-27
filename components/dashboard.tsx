"use client"

import type React from "react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Brain,
  Upload,
  Search,
  FileText,
  Globe,
  Settings,
  User,
  BarChart3,
  Moon,
  Sun,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Cloud,
  ArrowLeft,
  Download,
  Share,
} from "lucide-react"
import Link from "next/link"

interface ResearchSession {
  id: string
  query: string
  status: "pending" | "processing" | "completed" | "failed"
  results?: {
    keyTakeaways: string[]
    sources: Array<{
      type: string
      title: string
      description: string
      url?: string
      size?: number
    }>
    detailedInsights: string
  }
  live_search: boolean
  created_at: string
}

interface UploadedFile {
  id: string
  filename: string
  file_size: number
  file_type: string
  storage_path: string
  uploaded_to_supabase: boolean
}

export function Dashboard() {
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = useState("")
  const [liveSearch, setLiveSearch] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [localFiles, setLocalFiles] = useState<File[]>([]) // renamed from uploadedFiles to localFiles
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]) // added for Supabase uploaded files
  const [isResearching, setIsResearching] = useState(false)
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null)
  const [activeTab, setActiveTab] = useState("research")
  const [showUploadDialog, setShowUploadDialog] = useState(false) // added upload confirmation dialog
  const [isUploading, setIsUploading] = useState(false) // added upload loading state

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB limit
    })

    if (validFiles.length > 0) {
      setLocalFiles((prev) => [...prev, ...validFiles])
      console.log("[v0] Files added locally:", validFiles)
      setShowUploadDialog(true)
    }
  }

  const uploadFilesToSupabase = async () => {
    if (localFiles.length === 0) return

    setIsUploading(true)
    try {
      console.log("[v0] Starting upload process...")
      console.log(
        "[v0] Files to upload:",
        localFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      )

      const formData = new FormData()
      localFiles.forEach((file) => {
        formData.append("files", file)
      })
      formData.append("sessionId", "temp-session-" + Date.now())

      console.log("[v0] Uploading files to Supabase...")
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)
      console.log("[v0] Upload response ok:", response.ok)

      const result = await response.json()
      console.log("[v0] Upload response data:", result)

      if (response.ok && result.files) {
        console.log("[v0] Upload successful! Files:", result.files)
        setUploadedFiles((prev) => [...prev, ...result.files])
        setLocalFiles([]) // Clear local files after successful upload
        console.log("[v0] Files uploaded successfully to Supabase!")

        alert(`Successfully uploaded ${result.files.length} file(s) to Supabase!`)
      } else {
        console.error("[v0] Upload failed:", result.error || result)
        alert(`Upload failed: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert(`Upload error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
      setShowUploadDialog(false)
    }
  }

  const removeLocalFile = (index: number) => {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleStartResearch = async () => {
    if (!query.trim()) {
      console.log("[v0] No query provided")
      alert("Please enter a research question before starting.")
      return
    }

    setIsResearching(true)
    console.log("[v0] Starting research with query:", query)
    console.log("[v0] Live search enabled:", liveSearch)
    console.log(
      "[v0] Local files:",
      localFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    )
    console.log("[v0] Uploaded files:", uploadedFiles)

    try {
      const requestBody = {
        query: query.trim(),
        liveSearch,
        files: [
          ...localFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
          ...uploadedFiles.map((f) => ({ name: f.filename, size: f.file_size, type: f.file_type })),
        ],
      }

      console.log("[v0] Sending request to /api/research with body:", requestBody)

      // Start research session
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] API response status:", response.status)
      console.log("[v0] API response ok:", response.ok)

      const data = await response.json()
      console.log("[v0] API response data:", data)

      if (!response.ok) {
        console.error("[v0] API error response:", data)
        const errMsg = `${data.error || "Failed to start research"}${data.details ? ` - ${data.details}` : ""}`
        throw new Error(errMsg)
      }

      console.log("[v0] Research session started successfully:", data.sessionId)

      // Poll for results
      const sessionId = data.sessionId
      let pollCount = 0
      const maxPolls = 30 // 30 seconds max

      const pollInterval = setInterval(async () => {
        pollCount++
        console.log("[v0] Polling attempt:", pollCount)

        try {
          const sessionResponse = await fetch(`/api/research/${sessionId}`)
          console.log("[v0] Session poll response status:", sessionResponse.status)

          const sessionData = await sessionResponse.json()
          console.log("[v0] Session data:", sessionData)

          if (sessionData.status === "completed") {
            console.log("[v0] Research completed successfully!")
            setCurrentSession(sessionData)
            setActiveTab("results")
            clearInterval(pollInterval)
            setIsResearching(false)
          } else if (sessionData.status === "failed") {
            console.error("[v0] Research failed:", sessionData)
            clearInterval(pollInterval)
            setIsResearching(false)
          } else if (pollCount >= maxPolls) {
            console.warn("[v0] Polling timeout reached")
            clearInterval(pollInterval)
            setIsResearching(false)
          }
        } catch (error) {
          console.error("[v0] Error polling session:", error)
          clearInterval(pollInterval)
          setIsResearching(false)
        }
      }, 1000)
    } catch (error) {
      console.error("[v0] Research error:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to start research: ${message}`)
      setIsResearching(false)
    }
  }

  const exportReport = () => {
    if (!currentSession?.results) return

    const reportData = {
      query: currentSession.query,
      keyTakeaways: currentSession.results.keyTakeaways,
      sources: currentSession.results.sources,
      detailedInsights: currentSession.results.detailedInsights,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `research-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsPDF = async () => {
    if (!currentSession?.results) return

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Research Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            .query { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .takeaway { margin: 10px 0; padding-left: 20px; }
            .source { background: #f9fafb; padding: 10px; margin: 10px 0; border-left: 4px solid #2563eb; }
            .insights { margin-top: 20px; white-space: pre-line; }
          </style>
        </head>
        <body>
          <h1>Research Report</h1>
          <div class="query">
            <strong>Research Query:</strong> ${currentSession.query}
          </div>
          
          <h2>Key Takeaways</h2>
          ${currentSession.results.keyTakeaways.map((takeaway) => `<div class="takeaway">• ${takeaway}</div>`).join("")}
          
          <h2>Sources & Citations</h2>
          ${currentSession.results.sources
            .map(
              (source) => `
            <div class="source">
              <strong>${source.title}</strong> (${source.type})<br>
              ${source.description}
            </div>
          `,
            )
            .join("")}
          
          <h2>Detailed Insights</h2>
          <div class="insights">${currentSession.results.detailedInsights}</div>
          
          <hr style="margin-top: 40px;">
          <p><em>Generated on ${new Date().toLocaleString()} by ResearchAI</em></p>
        </body>
        </html>
      `

      // Create blob and download
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `research-report-${Date.now()}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Note: For actual PDF generation, you'd need a library like jsPDF or puppeteer
      alert("Report downloaded as HTML file. For PDF conversion, please print this file as PDF from your browser.")
    } catch (error) {
      console.error("Error downloading report:", error)
      alert("Error downloading report. Please try again.")
    }
  }

  const shareToWhatsApp = () => {
    if (!currentSession?.results) return

    const reportSummary = `🔬 *Research Report*\n\n*Query:* ${currentSession.query}\n\n*Key Findings:*\n${currentSession.results.keyTakeaways.map((takeaway) => `• ${takeaway}`).join("\n")}\n\n*Generated by ResearchAI*`

    const encodedText = encodeURIComponent(reportSummary)
    const whatsappUrl = `https://wa.me/?text=${encodedText}`

    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <nav className="sticky top-0 z-50 glass-effect border-b border-border/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center glow-effect shadow-xl group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text text-display">ResearchAI</span>
            </Link>

            <div className="flex items-center space-x-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="w-12 h-12 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:scale-110"
              >
                {theme === "light" ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-12 h-12 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:scale-110"
              >
                <User className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-16">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-lg grid-cols-3 h-20 bg-card/60 backdrop-blur-sm border-2 border-border/30 p-2 rounded-3xl shadow-xl">
              <TabsTrigger
                value="research"
                className="h-16 text-lg font-semibold rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all duration-300"
              >
                Research
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="h-16 text-lg font-semibold rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all duration-300"
              >
                Results
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="h-16 text-lg font-semibold rounded-2xl data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all duration-300"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Research Tab */}
          <TabsContent value="research" className="space-y-16">
            <div className="text-center py-20 space-y-10">
              <div className="space-y-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-display leading-tight">
                  What would you like to <span className="gradient-text">research</span> today?
                </h1>
                <p className="text-lg text-muted-foreground max-w-4xl mx-auto text-body leading-relaxed">
                  Ask any question and get comprehensive insights from your documents and live sources. Your AI research
                  companion that understands context and delivers precise results.
                </p>
              </div>
            </div>

            <Card className="glass-effect border-2 border-primary/30 glow-effect rounded-3xl shadow-2xl">
              <CardContent className="p-16">
                <div className="space-y-10">
                  <div className="space-y-8">
                    <Label htmlFor="query" className="text-lg font-bold">
                      Your Research Question
                    </Label>
                    <Textarea
                      id="query"
                      placeholder="e.g., What are the latest developments in renewable energy storage technologies?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-[160px] text-base resize-none border-2 focus:border-primary/50 bg-background/60 backdrop-blur-sm rounded-2xl transition-all duration-300"
                      disabled={isResearching}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Switch
                        id="live-search"
                        checked={liveSearch}
                        onCheckedChange={setLiveSearch}
                        disabled={isResearching}
                        className="scale-125"
                      />
                      <Label htmlFor="live-search" className="flex items-center space-x-4 text-lg font-semibold">
                        <Globe className="w-6 h-6" />
                        <span>Include live sources</span>
                      </Label>
                    </div>

                    <Button
                      size="lg"
                      className="btn-primary px-16 h-20 text-xl font-bold glow-effect rounded-3xl shadow-2xl"
                      disabled={!query.trim() || isResearching}
                      onClick={handleStartResearch}
                    >
                      {isResearching ? (
                        <>
                          <Loader2 className="w-7 h-7 mr-4 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <Search className="w-7 h-7 mr-4" />
                          Start Research
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`glass-effect border-2 border-dashed transition-all duration-500 rounded-3xl ${
                dragActive
                  ? "border-primary bg-primary/10 scale-[1.02] glow-effect shadow-2xl"
                  : "border-border/50 hover:border-primary/50 card-hover"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CardContent className="p-16 text-center">
                <div className="space-y-10">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <Upload className="w-16 h-16 text-primary" />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-display">Upload Your Documents</h3>
                    <p className="text-muted-foreground text-base text-body">
                      Drag and drop PDFs, Word docs, or text files here
                    </p>
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileInput}
                      className="hidden"
                      disabled={isResearching}
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      disabled={isResearching}
                      className="h-16 px-12 text-lg bg-background/60 backdrop-blur-sm border-2 border-border/30 hover:bg-background rounded-2xl transition-all duration-300"
                    >
                      <Plus className="w-6 h-6 mr-4" />
                      Choose Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {localFiles.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>Local Files ({localFiles.length})</span>
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Not uploaded to Supabase
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    These files are stored locally and will be uploaded when you confirm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {localFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-amber-100/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLocalFile(index)}
                          className="h-8 w-8 p-0"
                          disabled={isResearching}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={uploadFilesToSupabase}
                      className="flex items-center space-x-2"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>Upload to Supabase</span>
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setLocalFiles([])} disabled={isUploading}>
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {uploadedFiles.length > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-green-600" />
                    <span>Uploaded to Supabase ({uploadedFiles.length})</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    These files are stored in your Supabase storage and ready for research
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-green-100/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Cloud className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{file.filename}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadedFile(file.id)}
                          className="h-8 w-8 p-0"
                          disabled={isResearching}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-10">
              <Card className="glass-effect card-hover rounded-3xl border-2 border-border/30 shadow-xl">
                <CardHeader className="pb-8 pt-10">
                  <CardTitle className="flex items-center space-x-4 text-2xl group-hover:text-primary transition-colors">
                    <FileText className="w-8 h-8" />
                    <span>Recent Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-10">
                  <p className="text-muted-foreground text-lg text-body">
                    Access your latest research reports and findings
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect card-hover rounded-3xl border-2 border-border/30 shadow-xl">
                <CardHeader className="pb-8 pt-10">
                  <CardTitle className="flex items-center space-x-4 text-2xl group-hover:text-primary transition-colors">
                    <Settings className="w-8 h-8" />
                    <span>Research Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-10">
                  <p className="text-muted-foreground text-lg text-body">
                    Customize your research preferences and sources
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect card-hover rounded-3xl border-2 border-border/30 shadow-xl">
                <CardHeader className="pb-8 pt-10">
                  <CardTitle className="flex items-center space-x-4 text-2xl group-hover:text-primary transition-colors">
                    <BarChart3 className="w-8 h-8" />
                    <span>Usage Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-10">
                  <p className="text-muted-foreground text-lg text-body">View your research patterns and insights</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-8">
            {currentSession?.results && (
              <div className="flex items-center space-x-4 mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("research")}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Button>
              </div>
            )}

            <div className="text-center py-4">
              <h2 className="text-xl font-bold mb-2">Research Results</h2>
              <p className="text-muted-foreground">Your AI-generated insights and findings</p>
            </div>

            {currentSession?.results ? (
              <div className="space-y-6">
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Key Takeaways</CardTitle>
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                    <CardDescription>Research Query: "{currentSession.query}"</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <ul className="space-y-2">
                        {currentSession.results.keyTakeaways.map((takeaway, index) => (
                          <li key={index}>• {takeaway}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sources & Citations</CardTitle>
                    <CardDescription>Reliable sources used in this research</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentSession.results.sources.map((source, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        {source.type === "live" ? (
                          <Globe className="w-4 h-4 text-primary" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{source.title}</p>
                          <p className="text-xs text-muted-foreground">{source.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {source.type === "live" ? "Live" : "File"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detailed Insights</CardTitle>
                    <CardDescription>Comprehensive analysis and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {currentSession.results.detailedInsights}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-6">
                      <Button
                        onClick={exportReport}
                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                      </Button>

                      <Button
                        onClick={downloadAsPDF}
                        variant="outline"
                        className="border-primary/20 hover:bg-primary/10 bg-transparent"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>

                      <Button
                        onClick={shareToWhatsApp}
                        variant="outline"
                        className="border-green-500/20 hover:bg-green-500/10 text-green-600 hover:text-green-700 bg-transparent"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share to WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Research Results Yet</h3>
                <p className="text-muted-foreground mb-4">Start a research session to see your results here</p>
                <Button onClick={() => setActiveTab("research")}>
                  <Search className="w-4 h-4 mr-2" />
                  Start Research
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <div className="text-center py-4">
              <h2 className="text-xl font-bold mb-2">Research Analytics</h2>
              <p className="text-muted-foreground">Track your research activity and insights</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">+3 this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3s</div>
                  <Progress value={23} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                  <CardDescription>Your research milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98%</div>
                  <p className="text-xs text-muted-foreground">Excellent performance</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest research sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSession && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{currentSession.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(currentSession.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {currentSession.status === "completed" ? "Complete" : currentSession.status}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Ethics in Healthcare</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Climate Change Impact Analysis</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Complete
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Research Achievements</CardTitle>
                  <CardDescription>Your research milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Research Pro</p>
                      <p className="text-xs text-muted-foreground">Completed 20+ research reports</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Source Explorer</p>
                      <p className="text-xs text-muted-foreground">Used 50+ different sources</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 opacity-50">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Citation Master</p>
                      <p className="text-xs text-muted-foreground">Generate 100 citations (Progress: 67/100)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files to Supabase?</DialogTitle>
            <DialogDescription>
              Would you like to upload these {localFiles.length} file(s) to your Supabase storage? This will make them
              available for future research sessions and store them securely in the cloud.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {localFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
              Keep Local Only
            </Button>
            <Button onClick={uploadFilesToSupabase} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Upload to Supabase</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
