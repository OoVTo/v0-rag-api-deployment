import { type NextRequest, NextResponse } from "next/server"
import { FOOD_DATA, type FoodItem } from "@/lib/food-data"

function improvedSimilarity(query: string, text: string): number {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()

  // Exact phrase match gets highest score
  if (textLower.includes(queryLower)) {
    return 1.0
  }

  // Word-based similarity
  const queryWords = new Set(queryLower.split(/\s+/).filter((w) => w.length > 2))
  const textWords = textLower.split(/\s+/)

  let matches = 0
  for (const word of queryWords) {
    if (textWords.some((t) => t.includes(word) || word.includes(t))) {
      matches++
    }
  }

  return matches / Math.max(queryWords.size, 1)
}

function retrieveRelevantDocs(query: string, topK = 3): FoodItem[] {
  const scores = FOOD_DATA.map((item) => {
    let enriched = item.text
    if (item.region) {
      enriched += ` Region: ${item.region}.`
    }
    if (item.type) {
      enriched += ` Type: ${item.type}.`
    }

    const score = improvedSimilarity(query, enriched)
    return { score, item }
  })

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, topK).map((s) => s.item)
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
