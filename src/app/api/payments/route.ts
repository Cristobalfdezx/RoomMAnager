import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todos los pagos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const upcoming = searchParams.get('upcoming'); // pagos próximos a vencer

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;

    let payments = await db.payment.findMany({
      where,
      include: {
        tenant: {
          include: {
            room: {
              include: { property: true }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Filtrar pagos próximos a vencer (próximos 7 días)
    if (upcoming === 'true') {
      const now = new Date();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      
      payments = payments.filter(p => {
        const dueDate = new Date(p.dueDate);
        return dueDate >= now && dueDate <= weekLater && p.status === 'pending';
      });
    }

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}

// POST - Crear nuevo pago
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, concept, status, dueDate, paidDate, paymentMethod, reference, notes, tenantId } = body;

    const payment = await db.payment.create({
      data: {
        amount: parseFloat(amount),
        concept,
        status: status || 'pending',
        dueDate: new Date(dueDate),
        paidDate: paidDate ? new Date(paidDate) : null,
        paymentMethod,
        reference,
        notes,
        tenantId
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

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Error al crear pago' }, { status: 500 });
  }
}
