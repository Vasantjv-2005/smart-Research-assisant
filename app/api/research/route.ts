import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Research API called")

    const { query, liveSearch, files } = await request.json()
    console.log("[v0] Request data:", { query, liveSearch, files })

    if (!query?.trim()) {
      console.log("[v0] No query provided")
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("[v0] Creating Supabase client...")
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    console.log("[v0] Environment check:")
    console.log("[v0] OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Set" : "Missing")
    console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing")
    console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing")

    // Create research session
    console.log("[v0] Inserting research session...")
    const { data: session, error: sessionError } = await supabase
      .from("research_sessions")
      .insert({
        query: query.trim(),
        live_search: liveSearch,
        status: "processing",
      })
      .select()
      .single()

    if (sessionError) {
      console.error("[v0] Session creation error:", sessionError)
      return NextResponse.json({ error: "Failed to create research session", details: sessionError }, { status: 500 })
    }

    console.log("[v0] Research session created:", session)

    // Generate AI research results
    setTimeout(async () => {
      try {
        console.log("[v0] Generating AI research results...")

        // Strict, non-hallucination prompt: the model must admit uncertainty.
        const systemInstructions =
          "You are a careful research assistant. Only provide information you are reasonably confident in. If unsure or lacking reliable context, answer with: 'I don't have enough information to answer reliably.' Keep claims precise and avoid speculation."

        // Ask the model to return JSON we can parse reliably.
        const prompt = `
Return only strict JSON (no markdown) with this shape:
{
  "keyTakeaways": string[] (3 to 5 concise bullets),
  "detailedInsights": string
}

UserQuery: "${query.trim()}"

Constraints:
- If you are not confident, set "detailedInsights" to "I don't have enough information to answer reliably." and produce conservative keyTakeaways.
- Avoid fabricating citations or numbers. Do not include source URLs unless you are certain.
        `.trim()

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemInstructions,
          prompt,
        })

        let parsed: { keyTakeaways?: string[]; detailedInsights?: string } = {}
        try {
          parsed = JSON.parse(text)
        } catch (e) {
          console.warn("[v0] JSON parse failed; falling back to plain text summarization.")
          // Fallback: convert a plain text response into our expected object.
          const fallback = text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
          parsed = {
            keyTakeaways: fallback.slice(0, 4),
            detailedInsights: text,
          }
        }

        const safeKeyTakeaways =
          Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0
            ? parsed.keyTakeaways
            : [
                "The assistant could not extract confident takeaways for this topic.",
                "Consider refining the query or providing more context.",
              ]

        const safeInsights =
          typeof parsed.detailedInsights === "string" && parsed.detailedInsights.trim().length > 0
            ? parsed.detailedInsights.trim()
            : "I don't have enough information to answer reliably."

        const aiResults = {
          keyTakeaways: safeKeyTakeaways,
          sources: [], // No retrieval configured; avoid fabricated sources
          detailedInsights: safeInsights,
        }

        const { error: updateError } = await supabase
          .from("research_sessions")
          .update({
            status: "completed",
            results: aiResults,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id)

        if (updateError) {
          console.error("[v0] Error updating session with AI results:", updateError)
        } else {
          console.log("[v0] Session updated with AI results")
        }
      } catch (innerErr: any) {
        const innerMsg = typeof innerErr?.message === "string" ? innerErr.message : String(innerErr)
        console.error("[v0] AI generation error:", innerMsg)

        // Craft a more helpful message when quota/billing errors occur
        const isQuota = /quota|billing|rate limit/i.test(innerMsg)
        const friendlyMsg = isQuota
          ? "OpenAI quota/billing error: Please check your plan and billing details or use a different API key."
          : "I don't have enough information to answer reliably due to an internal error. Please try again."

        // Fail gracefully: mark session as completed with diagnostic message.
        const { error: updateError } = await supabase
          .from("research_sessions")
          .update({
            status: "completed",
            results: isQuota
              ? {
                  // Minimal, non-AI fallback so the UI always shows at least one line
                  keyTakeaways: [
                    `Quick take: Your question about "${query.trim()}" has been noted.`,
                  ],
                  sources: [],
                  detailedInsights:
                    `I can't access AI right now due to quota/billing limits. Here's a brief, non-AI note based on your input: ${query.trim()}.`,
                }
              : {
                  keyTakeaways: [
                    "An error occurred while generating AI results.",
                  ],
                  sources: [],
                  detailedInsights: `${friendlyMsg}\n\nDetails: ${innerMsg}`,
                },
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id)
        if (updateError) console.error("[v0] Fallback update error:", updateError)
      }
    }, 200) // Slight delay to return immediately while processing in background

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: "Research started successfully",
    })
  } catch (error: any) {
    console.error("[v0] Research API error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
