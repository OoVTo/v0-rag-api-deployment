"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Loader2, Search, ChefHat } from "lucide-react"

interface Source {
  id: string
  name: string
  text: string
  region: string
  type: string
}

interface QueryResult {
  answer: string
  sources: Source[]
}

export default function Home() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get answer")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-amber-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-amber-600" />
          <h1 className="text-2xl font-bold text-amber-900">Food Explorer</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">Discover Food Knowledge</h2>
          <p className="text-lg text-amber-700 mb-8">
            Ask anything about cuisines, dishes, and food from around the world
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="What would you like to know about food?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="text-base py-3 px-4 border-amber-200 focus:border-amber-500 focus:ring-amber-500"
            />
            <Button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Searching</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50 border-red-200 p-4 mb-8">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Answer Card */}
            <Card className="bg-white border-amber-200 p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Answer</h3>
              <div className="prose prose-sm max-w-none text-amber-900">
                <p className="text-base leading-relaxed">{result.answer}</p>
              </div>
            </Card>

            {/* Sources Card */}
            {result.sources.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 p-6">
                <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-4">Sources</h3>
                <div className="space-y-3">
                  {result.sources.map((source, idx) => (
                    <div key={source.id} className="bg-white rounded-lg p-4 border border-amber-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-amber-900">{source.name}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded">
                              {source.type}
                            </span>
                            <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                              {source.region}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-amber-500 flex-shrink-0">Source {idx + 1}</p>
                      </div>
                      <p className="text-sm text-amber-900 mt-3">{source.text}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !error && !loading && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 p-12 text-center">
            <ChefHat className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <p className="text-amber-700 text-lg">Ask a question above to explore food knowledge!</p>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 bg-white/70 backdrop-blur-sm mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-amber-600">
          <p>Powered by RAG • Food knowledge at your fingertips</p>
        </div>
      </footer>
    </div>
  )
}
