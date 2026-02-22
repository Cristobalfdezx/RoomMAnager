import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener contrato por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await db.contract.findUnique({
      where: { id },
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

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 });
  }
}

// PUT - Actualizar contrato
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { startDate, endDate, monthlyRent, deposit, depositPaid, depositReturned, status, terms, notes } = body;

    const contract = await db.contract.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : undefined,
        deposit: deposit ? parseFloat(deposit) : undefined,
        depositPaid,
        depositReturned,
        status,
        terms,
        notes
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

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Error al actualizar contrato' }, { status: 500 });
  }
}

// DELETE - Eliminar contrato
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.contract.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Error al eliminar contrato' }, { status: 500 });
  }
}
