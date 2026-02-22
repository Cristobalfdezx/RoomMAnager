import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';

// POST - Login, Register, Logout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;
  const body = await request.json();

  try {
    switch (action) {
      case 'login': {
        const { email, password } = body;
        
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

        if (!user || !verifyPassword(password, user.password)) {
          return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
        }

        // Crear sesión simple con token
        const token = generateToken();
        
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant: user.tenant
          },
          token
        });
      }

      case 'register': {
        const { email, password, name, role, tenantId } = body;

        // Verificar si el email ya existe
        const existingUser = await db.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
        }

        const hashedPassword = hashPassword(password);
        
        const user = await db.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: role || 'tenant',
            tenantId: tenantId || null
          },
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

        const token = generateToken();

        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant: user.tenant
          },
          token
        }, { status: 201 });
      }

      case 'logout': {
        // En un sistema simple, el logout es solo del lado del cliente
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}

// GET - Obtener usuario actual
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action === 'me') {
    // El cliente debe enviar el userId en el header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
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
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenant: user.tenant
    });
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
}
