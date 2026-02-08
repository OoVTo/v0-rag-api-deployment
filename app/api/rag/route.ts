import { type NextRequest, NextResponse } from "next/server"

interface SearchResult {
  title: string
  link: string
  snippet: string
}

async function searchGoogle(query: string, topK = 3): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    throw new Error("Google Search API credentials are not configured. Please set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.")
  }

  try {
    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1")
    searchUrl.searchParams.append("q", query)
    searchUrl.searchParams.append("key", apiKey)
    searchUrl.searchParams.append("cx", searchEngineId)
    searchUrl.searchParams.append("num", String(topK))

    const response = await fetch(searchUrl.toString())

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Google Search API error: ${errorData.error?.message || "Unknown error"}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return []
    }

    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }))
  } catch (error) {
    console.error("[v0] Google Search error:", error)
    throw error
  }
}

async function generateAnswerWithGroq(question: string, context: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured")
  }

  const prompt = `Use the following context from web search results to answer the question thoroughly and accurately.

Context:
${context}

Question: ${question}
Answer:`

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that answers questions based on web search results. Be concise, accurate, and cite the sources when relevant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Groq API error: ${errorData.error?.message || "Unknown error"}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("[v0] Groq API error:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const question = body.question?.trim()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    // Search Google for relevant sources
    const searchResults = await searchGoogle(question, 3)
    const context = searchResults.map((result) => `${result.title}\n${result.snippet}`).join("\n\n")

    // Generate answer using Groq
    const answer = await generateAnswerWithGroq(question, context)

    // Format sources with URLs
    const sources = searchResults.map((result, idx) => ({
      id: String(idx),
      name: result.title,
      text: result.snippet,
      url: result.link,
      type: "Web Source",
      region: "Internet",
    }))

    return NextResponse.json({
      answer,
      sources,
    })
  } catch (error) {
    console.error("[v0] RAG error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "RAG API with Google Search is running",
  })
}
