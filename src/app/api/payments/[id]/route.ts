import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Obtener pago por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await db.payment.findUnique({
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

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Error al obtener pago' }, { status: 500 });
  }
}

// PUT - Actualizar pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, concept, status, dueDate, paidDate, paymentMethod, reference, notes } = body;

    const payment = await db.payment.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        concept,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paidDate: paidDate ? new Date(paidDate) : null,
        paymentMethod,
        reference,
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

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 });
  }
}

// DELETE - Eliminar pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.payment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 });
  }
}
