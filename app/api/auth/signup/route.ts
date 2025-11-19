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
					cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
				},
			},
		}
	)
	try {
		const { email, password, name, whatsapp } = await req.json()
		if (!email || !password) {
			return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
		}

		// Sign up
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
				data: {
					name: name || email,
					whatsapp: whatsapp || '',
				},
			},
		})
		if (error) {
			return NextResponse.json({ error: error.message, code: error.status }, { status: 400 })
		}

		// Best-effort profile creation (does not fail the request)
		try {
			if (data.user?.id) {
				await supabase
					.from('profiles')
					.upsert(
						{
							id: data.user.id,
							email: data.user.email || email,
							name: name || data.user.email || email,
							whatsapp: whatsapp || '',
						},
						{ onConflict: 'id' }
					)
			}
		} catch {}

		response = NextResponse.json({ user: data.user, session: data.session })
		return response
	} catch (e: any) {
		return NextResponse.json(
			{ error: e?.message || 'Unexpected error during signup' },
			{ status: 500 }
		)
	}
}


