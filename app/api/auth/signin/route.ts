import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
	const cookieStore = await cookies()
	let response = NextResponse.json({ ok: true })
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
					// also reflect on the response headers
					cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
				},
			},
		}
	)
	try {
		const { email, password } = await req.json()
		if (!email || !password) {
			return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
		}

		const start = Date.now()
		const { data, error } = await supabase.auth.signInWithPassword({ email, password })
		console.log('[api/auth/signin] duration(ms)=', Date.now() - start, 'error=', error?.message)
		if (error) {
			return NextResponse.json({ error: error.message, code: error.status }, { status: 401 })
		}

		// Ensure cookies are attached to response
		response = NextResponse.json({ user: data.user, session: data.session })
		return response
	} catch (e: any) {
		console.error('[api/auth/signin] failure:', e)
		return NextResponse.json(
			{ error: e?.message || 'Unexpected error during sign in' },
			{ status: 500 }
		)
	}
}


