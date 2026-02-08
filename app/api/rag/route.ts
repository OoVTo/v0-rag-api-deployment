import { type NextRequest, NextResponse } from "next/server"
import { FOOD_DATA, type FoodItem } from "@/lib/food-data"

function improvedSimilarity(query: string, text: string, region: string, type: string): number {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'from', 'of', 'with', 'by'])

  // Exact phrase match gets highest score
  if (textLower.includes(queryLower)) {
    return 1.0
  }

  // Extract meaningful words (not stopwords)
  const queryWords = new Set(
    queryLower.split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w))
  )
  
  const textWords = textLower.split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w))

  if (queryWords.size === 0) {
    return 0
  }

  // Count significant word matches
  let significantMatches = 0
  for (const word of queryWords) {
    if (textWords.some((t) => t.includes(word) || word.includes(t))) {
      significantMatches++
    }
  }

  // Check if region or type matches
  let regionBoost = 0
  let typeBoost = 0
  
  if (region && region.toLowerCase().split(/\s+/).some((w) => queryLower.includes(w))) {
    regionBoost = 0.3
  }
  
  if (type && queryLower.includes(type.toLowerCase())) {
    typeBoost = 0.2
  }

  const baseScore = significantMatches / queryWords.size
  return Math.min(1.0, baseScore + regionBoost + typeBoost)
}

function retrieveRelevantDocs(query: string, topK = 3): FoodItem[] {
  const scores = FOOD_DATA.map((item) => {
    const score = improvedSimilarity(query, item.text, item.region || "", item.type || "")
    return { score, item }
  })

  scores.sort((a, b) => b.score - a.score)
  
  // Filter out results with zero score if we have better matches
  const topResults = scores.slice(0, topK)
  if (topResults.length > 0 && topResults[0].score > 0) {
    return topResults.map((s) => s.item)
  }
  
  // Fallback: return top results anyway if no matches found
  return topResults.map((s) => s.item)
}

async function generateAnswerWithGroq(question: string, context: string): Promise<string> {
  const groqApiKey = process.env.GROQ_API_KEY

  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured")
  }

  const prompt = `Use the following context to answer the question.

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
              "You are a helpful assistant that answers questions about food based on the provided context. Be concise and accurate. Include information about the region and type of food when relevant.",
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

    // Retrieve relevant documents
    const relevantDocs = retrieveRelevantDocs(question, 3)
    console.log("[v0] Question:", question)
    console.log("[v0] Retrieved docs:", relevantDocs.map(d => d.text.substring(0, 50)))
    const context = relevantDocs.map((doc) => doc.text).join("\n")

    // Generate answer using Groq
    const answer = await generateAnswerWithGroq(question, context)

    // Format sources
    const sources = relevantDocs.map((doc) => ({
      id: doc.id,
      name: doc.text.split("\n")[0].split(" is ")[0].trim(),
      text: doc.text,
      region: doc.region || "Global",
      type: doc.type || "Food",
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
    message: "RAG API is running",
    documents_loaded: FOOD_DATA.length,
    last_updated: "2025-12-06",
  })
}
