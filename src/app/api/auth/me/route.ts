import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get current user - GET
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    const session = JSON.parse(sessionCookie.value);

    // Obtener datos actualizados del usuario
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        tenant: {
          include: {
            room: {
              include: { property: true }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: user.tenant
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ user: null });
  }
}
