import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
	const supabase = await createClient()
	try {
		const { email, token, type } = await req.json()
		if (!email || !token) {
			return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
		}
		const { data, error } = await supabase.auth.verifyOtp({
			email,
			token,
			type: (type as any) || 'signup',
		})
		if (error) {
			return NextResponse.json({ error: error.message, code: error.status }, { status: 400 })
		}
		return NextResponse.json({ user: data.user, session: data.session })
	} catch (e: any) {
		return NextResponse.json(
			{ error: e?.message || 'Unexpected error during verification' },
			{ status: 500 }
		)
	}
}


