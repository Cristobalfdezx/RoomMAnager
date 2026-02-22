import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todos los contratos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantId = searchParams.get('tenantId');
    const expiring = searchParams.get('expiring'); // contratos próximos a vencer

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;

    let contracts = await db.contract.findMany({
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
      orderBy: { endDate: 'asc' }
    });

    // Filtrar contratos próximos a vencer (próximos 30 días)
    if (expiring === 'true') {
      const now = new Date();
      const monthLater = new Date();
      monthLater.setDate(monthLater.getDate() + 30);
      
      contracts = contracts.filter(c => {
        const endDate = new Date(c.endDate);
        return endDate >= now && endDate <= monthLater && c.status === 'active';
      });
    }

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 });
  }
}

// POST - Crear nuevo contrato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractNumber, startDate, endDate, monthlyRent, deposit, depositPaid, terms, notes, tenantId } = body;

    const contract = await db.contract.create({
      data: {
        contractNumber: contractNumber || `CTR-${Date.now()}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent: parseFloat(monthlyRent),
        deposit: parseFloat(deposit),
        depositPaid: depositPaid || false,
        terms,
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

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}
