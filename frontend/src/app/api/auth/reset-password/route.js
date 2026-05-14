import { NextResponse } from 'next/server'

export async function POST() {
    try {
        /** implement reset password logic here */
        return NextResponse.json(true)
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
