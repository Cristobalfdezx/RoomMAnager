import { NextResponse } from 'next/server';

// Logout - POST
export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Eliminar cookie de sesión
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  });

  return response;
}
