import { NextResponse } from 'next/server'
import { resend, SENDER_EMAIL } from '../../lib/resend'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: 'Verify your HydroProjekt account',
      html: `
        <h2>Welcome to HydroProjekt!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/verify?email=${email}">
          Verify Email Address
        </a></p>
        <p>If you did not create an account, please ignore this email.</p>
      `
    })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Verification email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 