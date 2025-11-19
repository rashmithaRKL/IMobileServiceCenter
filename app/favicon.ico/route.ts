import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Serve the logo as favicon
    const filePath = join(process.cwd(), 'public', 'imobile-logo.png')
    const fileBuffer = await readFile(filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // If file doesn't exist, return 204 No Content to prevent 404 errors
    return new NextResponse(null, { status: 204 })
  }
}

