import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const response: any = {
    environment: {
      url: url || '❌ Not loaded',
      key: key ? '✅ Loaded (hidden for safety)' : '❌ Not loaded',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || '❌ Not loaded',
      nodeEnv: process.env.NODE_ENV || '❌ Not loaded',
      hasUrl: !!url,
      hasKey: !!key,
    },
    connection: {
      status: 'not_tested',
      message: '',
    }
  }

  // Test actual connection if env vars are present
  if (url && key) {
    try {
      const supabase = await createClient()
      
      // Test database connection
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        response.connection = {
          status: 'error',
          message: `Database connection failed: ${error.message}`,
          error: error.message,
        }
      } else {
        response.connection = {
          status: 'success',
          message: '✅ Database connection successful!',
        }
      }
    } catch (error: any) {
      response.connection = {
        status: 'error',
        message: `Connection test failed: ${error.message}`,
        error: error.message,
      }
    }
  } else {
    response.connection = {
      status: 'skipped',
      message: 'Cannot test connection: Environment variables are missing',
    }
  }

  return NextResponse.json(response, {
    status: response.environment.hasUrl && response.environment.hasKey ? 200 : 500,
  })
}

