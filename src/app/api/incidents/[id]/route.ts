import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener incidencia por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const incident = await db.incident.findUnique({
      where: { id },
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
      }
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    return NextResponse.json({ error: 'Error al obtener incidencia' }, { status: 500 });
  }
}

// PUT - Actualizar incidencia
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, priority, status, image } = body;

    const incident = await db.incident.update({
      where: { id },
      data: {
        title,
        description,
        category,
        priority,
        status,
        image
      },
      include: {
        room: {
          include: { property: true }
        },
        tenant: true
      }
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Error al actualizar incidencia' }, { status: 500 });
  }
}

// DELETE - Eliminar incidencia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.incident.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting incident:', error);
    return NextResponse.json({ error: 'Error al eliminar incidencia' }, { status: 500 });
  }
}
