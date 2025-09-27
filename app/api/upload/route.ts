import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Upload API called")

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const sessionId = formData.get("sessionId") as string

    console.log("[v0] Upload API called with files:", files.length)
    console.log("[v0] Session ID:", sessionId)

    if (!files.length) {
      console.log("[v0] No files provided")
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createClient()
      console.log("[v0] Supabase client created successfully")
    } catch (error) {
      console.error("[v0] Supabase client creation error:", error)
      return NextResponse.json(
        {
          error: "Supabase configuration error. Please check your environment variables.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    const uploadedFiles = []
    const supabaseUrl = "https://rantpxnpbbyujnhaggbg.supabase.co"

    // For now, use a dummy user ID for testing
    const dummyUserId = "test-user-" + Date.now()
    console.log("[v0] Using dummy user ID:", dummyUserId)

    for (const file of files) {
      console.log("[v0] Processing file:", file.name, "Size:", file.size, "Type:", file.type)

      // Validate file
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (!validTypes.includes(file.type)) {
        console.log("[v0] Invalid file type:", file.type)
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        console.log("[v0] File too large:", file.size)
        continue
      }

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      console.log("[v0] Uploading to bucket 'user-uploads' with filename:", fileName)

      const fileBuffer = await file.arrayBuffer()
      console.log("[v0] File converted to buffer, size:", fileBuffer.byteLength)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        if (uploadError.message?.includes("bucket")) {
          return NextResponse.json(
            {
              error: "Storage bucket not found. Please run the storage setup script first.",
            },
            { status: 500 },
          )
        }
        continue
      }

      console.log("[v0] Upload successful:", uploadData)

      const fileUrl = `${supabaseUrl}/storage/v1/object/public/user-uploads/${uploadData.path}`
      console.log("[v0] File URL:", fileUrl)

      const { data: fileRecord, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          user_id: dummyUserId,
          session_id: sessionId,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: uploadData.path,
          file_url: fileUrl,
          status: "uploaded",
        })
        .select()
        .single()

      if (dbError) {
        console.error("[v0] Database error:", dbError)
      } else {
        console.log("[v0] File record saved:", fileRecord)
      }

      uploadedFiles.push({
        id: fileRecord?.id || `temp-${Date.now()}`,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: uploadData.path,
        uploaded_to_supabase: true,
      })
    }

    console.log("[v0] Upload complete. Files uploaded:", uploadedFiles.length)
    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`,
    })
  } catch (error) {
    console.error("[v0] Upload API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
