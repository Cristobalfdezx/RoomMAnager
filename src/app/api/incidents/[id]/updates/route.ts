import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Añadir actualización a incidencia
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, status } = body;

    const update = await db.$transaction(async (tx) => {
      // Crear la actualización
      const newUpdate = await tx.incidentUpdate.create({
        data: {
          message,
          status,
          incidentId: id
        }
      });

      // Si hay cambio de estado, actualizar la incidencia
      if (status) {
        await tx.incident.update({
          where: { id },
          data: { status }
        });
      }

      return newUpdate;
    });

    return NextResponse.json(update, { status: 201 });
  } catch (error) {
    console.error('Error creating update:', error);
    return NextResponse.json({ error: 'Error al crear actualización' }, { status: 500 });
  }
}
