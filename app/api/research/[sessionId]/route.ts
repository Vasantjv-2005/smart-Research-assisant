import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { sessionId } = params
    const supabase = await createClient()

    const { data: session, error } = await supabase.from("research_sessions").select("*").eq("id", sessionId).single()

    if (error) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Get research session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
