import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todas las habitaciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    const where = propertyId ? { propertyId } : {};

    const rooms = await db.room.findMany({
      where,
      include: {
        property: true,
        tenants: {
          where: { status: 'active' }
        },
        incidents: {
          where: { status: { not: 'closed' } },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: [{ property: { name: 'asc' } }, { number: 'asc' }]
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Error al obtener habitaciones' }, { status: 500 });
  }
}

// POST - Crear nueva habitación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { number, name, floor, price, size, amenities, status, image, propertyId } = body;

    const room = await db.room.create({
      data: {
        number,
        name,
        floor: floor || 1,
        price: parseFloat(price),
        size: size ? parseFloat(size) : null,
        amenities,
        status: status || 'available',
        image,
        propertyId
      },
      include: {
        property: true
      }
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Error al crear habitación' }, { status: 500 });
  }
}
