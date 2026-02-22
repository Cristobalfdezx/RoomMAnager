import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todas las propiedades con habitaciones
export async function GET() {
  try {
    const properties = await db.property.findMany({
      include: {
        rooms: {
          include: {
            tenants: {
              where: { status: 'active' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const propertiesWithStats = properties.map(property => ({
      ...property,
      totalRooms: property.rooms.length,
      occupiedRooms: property.rooms.filter(r => r.status === 'occupied').length,
      availableRooms: property.rooms.filter(r => r.status === 'available').length,
      maintenanceRooms: property.rooms.filter(r => r.status === 'maintenance').length,
    }));

    return NextResponse.json(propertiesWithStats);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Error al obtener propiedades' }, { status: 500 });
  }
}

// POST - Crear nueva propiedad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, postalCode, description, image } = body;

    const property = await db.property.create({
      data: {
        name,
        address,
        city,
        postalCode,
        description,
        image
      }
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Error al crear propiedad' }, { status: 500 });
  }
}
