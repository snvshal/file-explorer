import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.raw+json",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: response.status })
    }

    const text = await response.text()
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 })
  }
}
