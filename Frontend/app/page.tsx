"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Play,
  Download,
  Copy,
  Send,
  Grid3X3,
  Maximize2,
  Brain,
  Activity,
  CheckCircle,
  Upload,
  FileImage,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Minimize2,
} from "lucide-react"
import Image from "next/image"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface AnalysisResult {
  hypothesis: string
  confidence: number
  observations: string[]
  severity: "low" | "medium" | "high"
  fullReport: string
}

interface ApiAnalysisResult {
  response: string
}

interface UploadedImage {
  id: string
  name: string
  url: string
  type: string
}

export default function MedGemmaInterface() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [clinicalContext, setClinicalContext] = useState("")
  const [viewMode, setViewMode] = useState<"single" | "grid">("single")
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [expandedResults, setExpandedResults] = useState(false)
  const [fullAnalysisView, setFullAnalysisView] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const newImage: UploadedImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: e.target?.result as string,
            type: file.type,
          }
          setUploadedImages((prev) => [...prev, newImage])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const deleteImage = (imageId: string) => {
    setUploadedImages((prev) => {
      const newImages = prev.filter((img) => img.id !== imageId)

      // Reset current index if needed
      if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(Math.max(0, newImages.length - 1))
      }

      // Reset analysis states if no images left
      if (newImages.length === 0) {
        setAnalysisComplete(false)
        setFullAnalysisView(false)
        setExpandedResults(false)
      }

      return newImages
    })
  }

  const deleteCurrentImage = () => {
    if (uploadedImages.length > 0) {
      deleteImage(uploadedImages[currentImageIndex].id)
    }
  }

  const startAnalysis = async () => {
    if (!uploadedImages.length) return
    
    setIsAnalyzing(true)
    setAnalysisComplete(false)
    setScanProgress(0)
    setApiError(null)
    
    // Create progress simulation
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 5
      })
    }, 200)
    
    try {
      const currentImage = uploadedImages[currentImageIndex]
      const imageFile = await fetch(currentImage.url)
        .then(res => res.blob())
        .then(blob => new File([blob], currentImage.name, { type: currentImage.type }))
      
      const prompt = clinicalContext 
        ? `Analysez cette image médicale. Contexte clinique: ${clinicalContext}`
        : "Analysez cette image médicale et fournissez un diagnostic détaillé."
      
      const result = await ApiService.generate(prompt, imageFile)
      
      // Parse the API response into our analysis format
      const parsedResult = parseApiResponse(result.response)
      setAnalysisResult(parsedResult)
      
      setScanProgress(100)
      setIsAnalyzing(false)
      setAnalysisComplete(true)
      
    } catch (error) {
      console.error('Analysis failed:', error)
      setApiError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse')
      setIsAnalyzing(false)
      setScanProgress(0)
    } finally {
      clearInterval(progressInterval)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")

    try {
      let prompt = inputMessage
      if (analysisResult) {
        prompt = `Basé sur l'analyse précédente: ${analysisResult.hypothesis}. Question: ${inputMessage}`
      }
      
      const result = await ApiService.generateText(prompt)
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: result.response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      
    } catch (error) {
      console.error('Chat failed:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const toggleFullAnalysisView = () => {
    setFullAnalysisView(!fullAnalysisView)
  }

  const parseApiResponse = (response: string): AnalysisResult => {
    // Simple parsing logic - in production, you might want more sophisticated parsing
    const lines = response.split('\n').filter(line => line.trim())
    
    return {
      hypothesis: lines[0] || "Analyse générée par MedGemma",
      confidence: 85, // Default confidence
      observations: lines.slice(1, 5).map(line => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean),
      severity: "medium" as const,
      fullReport: response
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const hasImages = uploadedImages.length > 0
  const currentImage = uploadedImages[currentImageIndex]

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex">
      {/* Partie Gauche - Visualisation et Upload */}
      <div className="w-1/2 flex flex-col bg-slate-900 border-r border-slate-700">
        {/* État initial - Grande zone d'upload */}
        {!hasImages && (
          <div className="flex-1 p-8 flex items-center justify-center">
            <div
              className={`w-full h-full max-w-2xl max-h-2xl border-2 border-dashed rounded-2xl transition-all duration-300 flex items-center justify-center ${
                isDragOver
                  ? "border-cyan-400 bg-cyan-400/10 scale-105"
                  : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center p-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-slate-700 rounded-full flex items-center justify-center">
                  <FileImage className="w-12 h-12 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">Chargez vos images médicales</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Glissez et déposez vos fichiers d'imagerie médicale ici, ou cliquez pour parcourir vos fichiers
                </p>
                <Button
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3"
                >
                  <Upload className="w-5 h-5 mr-3" />
                  Sélectionner des fichiers
                </Button>
                <p className="text-xs text-gray-500 mt-4">Formats supportés: JPG, PNG, DICOM</p>
              </div>
            </div>
          </div>
        )}

        {/* État avec images - Interface complète */}
        {hasImages && (
          <>
            {/* Barre d'outils compacte */}
            <div className="p-3 border-b border-slate-700 bg-slate-800/50">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("single")}
                    className="border-slate-600 h-8 text-xs"
                  >
                    <Maximize2 className="w-3 h-3 mr-1" />
                    Unique
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="border-slate-600 h-8 text-xs"
                  >
                    <Grid3X3 className="w-3 h-3 mr-1" />
                    Grille
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {uploadedImages.length} image{uploadedImages.length > 1 ? "s" : ""}
                  </span>
                  {viewMode === "single" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={deleteCurrentImage}
                      className="border-red-600 h-8 w-8 p-0 hover:bg-red-600/20 hover:border-red-500 text-red-400 bg-transparent"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-600 h-8 w-8 p-0 hover:bg-cyan-600/20 hover:border-cyan-500"
                  >
                    <Plus className="w-4 h-4 text-cyan-400" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Zone d'affichage des images - Plein écran */}
            <div className="flex-1 relative bg-black">
              {viewMode === "single" ? (
                <div className="relative w-full h-full">
                  <Image
                    src={currentImage?.url || uploadedImages[0]?.url}
                    alt={currentImage?.name || "Image médicale"}
                    fill
                    className="object-contain"
                  />

                  {/* Navigation entre images si plusieurs */}
                  {uploadedImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex gap-2 bg-slate-800/90 rounded-full px-4 py-2">
                        {uploadedImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex ? "bg-cyan-400" : "bg-slate-600 hover:bg-slate-500"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nom de l'image */}
                  <div className="absolute top-4 left-4 bg-slate-800/90 text-cyan-400 text-sm px-3 py-1 rounded">
                    {currentImage?.name || uploadedImages[0]?.name}
                  </div>

                  {/* Effet de balayage pendant l'analyse */}
                  {isAnalyzing && (
                    <div
                      className="absolute left-0 w-full h-0.5 bg-cyan-400 shadow-lg shadow-cyan-400/50 transition-all duration-100"
                      style={{ top: `${scanProgress}%` }}
                    />
                  )}

                  {/* Overlay des résultats */}
                  {analysisComplete && (
                    <div className="absolute inset-0">
                      <div
                        className="absolute bg-red-500/20 border-2 border-red-400 rounded"
                        style={{
                          top: "35%",
                          left: "45%",
                          width: "15%",
                          height: "20%",
                        }}
                      >
                        <div className="absolute -top-8 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          Zone suspecte
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 h-full p-2">
                  {uploadedImages.slice(0, 4).map((image, index) => (
                    <div
                      key={image.id}
                      className="relative bg-black rounded overflow-hidden group"
                      onMouseEnter={() => setHoveredImageId(image.id)}
                      onMouseLeave={() => setHoveredImageId(null)}
                    >
                      <Image src={image.url || "/placeholder.svg"} alt={image.name} fill className="object-contain" />
                      <div className="absolute top-2 left-2 bg-slate-800/80 text-cyan-400 text-xs px-2 py-1 rounded">
                        {image.name.split(".")[0]}
                      </div>

                      {/* Bouton de suppression en mode grille */}
                      {hoveredImageId === image.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteImage(image.id)}
                          className="absolute top-2 right-2 border-red-600 h-6 w-6 p-0 bg-slate-900/80 hover:bg-red-600/20 hover:border-red-500 text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Barre de progression de l'analyse */}
            {isAnalyzing && (
              <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-cyan-400 h-1.5 rounded-full transition-all duration-100"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{scanProgress}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Analyse en cours par MedGemma...</p>
              </div>
            )}
          </>
        )}

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </div>

      {/* Partie Droite - Contrôles et Chat */}
      <div className="w-1/2 flex flex-col">
        {/* Vue Analyse Complète */}
        {fullAnalysisView && analysisComplete && analysisResult ? (
          <div className="flex-1 p-4">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-cyan-400" />
                    Analyse Détaillée MedGemma
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFullAnalysisView}
                      className="border-slate-600 hover:bg-slate-700 bg-transparent"
                    >
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Réduire
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 hover:bg-slate-700 bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-600 hover:bg-slate-700 bg-transparent">
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-full">
                  <div className="space-y-6">
                    {/* Hypothèse principale */}
                    <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-100">Hypothèse Principale</h3>
                        <Badge className={getSeverityColor(analysisResult.severity)}>
                          Confiance: {analysisResult.confidence}%
                        </Badge>
                      </div>
                      <p className="text-cyan-400 font-medium text-lg">{analysisResult.hypothesis}</p>
                    </div>

                    {/* Observations */}
                    <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <h4 className="text-md font-medium text-gray-300 mb-3">Observations Clés:</h4>
                      <ul className="space-y-2">
                        {analysisResult.observations.map((obs, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contexte clinique */}
                    {clinicalContext && (
                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <h4 className="text-md font-medium text-gray-300 mb-2">Contexte Clinique:</h4>
                        <p className="text-sm text-gray-400">{clinicalContext}</p>
                      </div>
                    )}

                    {/* Rapport complet */}
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                      <h4 className="text-md font-medium text-gray-300 mb-3">Rapport Complet:</h4>
                      <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                        {analysisResult.fullReport}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Vue Normale - Split */
          <>
            {/* Tableau de Bord Compact */}
            <div className="p-4 border-b border-slate-700">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      MedGemma Analysis
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contexte Clinique Compact */}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Contexte clinique (symptômes, antécédents...)"
                      value={clinicalContext}
                      onChange={(e) => setClinicalContext(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-gray-100 placeholder-gray-400 text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Error display */}
                  {apiError && (
                    <div className="p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
                      {apiError}
                    </div>
                  )}

                  {/* Bouton d'analyse compact */}
                  <Button
                    onClick={startAnalysis}
                    disabled={isAnalyzing || !hasImages}
                    size="sm"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isAnalyzing ? "Analyse..." : hasImages ? "Analyser" : "Chargez une image"}
                  </Button>

                  {/* Résultats compacts et expandables */}
                  {analysisComplete && analysisResult && (
                    <Collapsible open={expandedResults} onOpenChange={setExpandedResults}>
                      <div className="space-y-2">
                        <div
                          className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-600/50 transition-colors"
                          onClick={toggleFullAnalysisView}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(analysisResult.severity)} variant="outline">
                                {analysisResult.confidence}%
                              </Badge>
                              <span className="text-xs text-gray-400">Confiance</span>
                            </div>
                            <p className="text-sm font-medium text-cyan-400 line-clamp-2">
                              {analysisResult.hypothesis}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Cliquez pour voir l'analyse complète</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFullAnalysisView()
                              }}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {expandedResults ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent className="space-y-2">
                          <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Observations:</h4>
                            <ul className="space-y-1">
                              {analysisResult.observations.map((obs, index) => (
                                <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                  {obs}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {clinicalContext && (
                            <div className="p-2 bg-slate-700/30 rounded border border-slate-600">
                              <h4 className="text-xs font-medium text-gray-300 mb-1">Contexte:</h4>
                              <p className="text-xs text-gray-400">{clinicalContext}</p>
                            </div>
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assistant Conversationnel */}
            <div className="flex-1 p-4">
              <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Assistant IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-3">
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 mb-2">Assistant IA prêt</p>
                          <p className="text-xs text-gray-600">Posez vos questions pour affiner l'analyse</p>
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-lg text-sm ${
                              message.type === "user"
                                ? "bg-cyan-600 text-white"
                                : "bg-slate-700 text-gray-100 border border-slate-600"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-slate-700">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Posez une question..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        className="bg-slate-700 border-slate-600 text-gray-100 placeholder-gray-400"
                      />
                      <Button onClick={sendMessage} size="icon" className="bg-cyan-600 hover:bg-cyan-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
