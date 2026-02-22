import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Login - POST
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    // Buscar usuario
    const user = await db.user.findUnique({
      where: { email },
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
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    // Verificar contraseña (en producción usar bcrypt)
    // Por ahora usamos comparación simple
    if (user.password !== password) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // Crear respuesta con cookie de sesión
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: user.tenant
      }
    });

    // Establecer cookie de sesión (dura 7 días)
    response.cookies.set('session', JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
