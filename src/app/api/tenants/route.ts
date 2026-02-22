import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todos los inquilinos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const roomId = searchParams.get('roomId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;

    const tenants = await db.tenant.findMany({
      where,
      include: {
        room: {
          include: {
            property: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return NextResponse.json({ error: 'Error al obtener inquilinos' }, { status: 500 });
  }
}

// POST - Crear nuevo inquilino
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, dni, photo, moveIn, moveOut, status, roomId } = body;

    // Crear inquilino y actualizar estado de habitación
    const tenant = await db.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name,
          email,
          phone,
          dni,
          photo,
          moveIn: new Date(moveIn),
          moveOut: moveOut ? new Date(moveOut) : null,
          status: status || 'active',
          roomId
        },
        include: {
          room: {
            include: { property: true }
          }
        }
      });

      // Actualizar estado de la habitación a ocupada
      await tx.room.update({
        where: { id: roomId },
        data: { status: 'occupied' }
      });

      return newTenant;
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Error al crear inquilino' }, { status: 500 });
  }
}
