import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todas las incidencias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const roomId = searchParams.get('roomId');
    const propertyId = searchParams.get('propertyId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (roomId) where.roomId = roomId;
    if (propertyId) {
      where.room = { propertyId };
    }

    const incidents = await db.incident.findMany({
      where,
      include: {
        room: {
          include: {
            property: true,
            tenants: { where: { status: 'active' } }
          }
        },
        tenant: true,
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json({ error: 'Error al obtener incidencias' }, { status: 500 });
  }
}

// POST - Crear nueva incidencia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, priority, status, image, roomId, tenantId } = body;

    const incident = await db.incident.create({
      data: {
        title,
        description,
        category: category || 'other',
        priority: priority || 'medium',
        status: status || 'open',
        image,
        roomId,
        tenantId: tenantId || null
      },
      include: {
        room: {
          include: { property: true }
        },
        tenant: true
      }
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json({ error: 'Error al crear incidencia' }, { status: 500 });
  }
}
