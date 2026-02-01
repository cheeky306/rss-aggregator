import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.APP_PASSWORD;

    if (!correctPassword) {
      console.error('APP_PASSWORD not set in environment');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password === correctPassword) {
      // Set auth cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set('cheeks-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  // Logout - clear the cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('cheeks-auth');
  return response;
}
