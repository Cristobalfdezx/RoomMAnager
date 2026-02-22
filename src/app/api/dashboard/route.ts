import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Estadísticas básicas
    const [
      totalProperties,
      totalRooms,
      totalTenants,
      totalIncidents,
      openIncidents,
      inProgressIncidents,
      incidentsByCategory,
      incidentsByPriority,
      recentIncidents,
      occupiedRooms,
      availableRooms,
      maintenanceRooms
    ] = await Promise.all([
      db.property.count(),
      db.room.count(),
      db.tenant.count({ where: { status: 'active' } }),
      db.incident.count(),
      db.incident.count({ where: { status: 'open' } }),
      db.incident.count({ where: { status: 'in_progress' } }),
      db.incident.groupBy({ by: ['category'], _count: { id: true } }),
      db.incident.groupBy({ by: ['priority'], _count: { id: true } }),
      db.incident.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { room: { include: { property: true } } }
      }),
      db.room.count({ where: { status: 'occupied' } }),
      db.room.count({ where: { status: 'available' } }),
      db.room.count({ where: { status: 'maintenance' } })
    ]);

    // Pagos - con try/catch individual
    let paymentsData = { total: 0, pending: 0, paid: 0, overdue: 0, pendingAmount: 0, paidThisMonth: 0, upcomingPayments: [] };
    try {
      const payments = db as unknown as { payment: { count: (a?: unknown) => Promise<number>; aggregate: (a: unknown) => Promise<{ _sum: { amount: number | null } }>; findMany: (a: unknown) => Promise<unknown[]> } };
      const [total, pending, paid, overdue, pendingSum, paidSum, upcoming] = await Promise.all([
        payments.payment.count(),
        payments.payment.count({ where: { status: 'pending' } }),
        payments.payment.count({ where: { status: 'paid' } }),
        payments.payment.count({ where: { status: 'overdue' } }),
        payments.payment.aggregate({ where: { status: { in: ['pending', 'overdue'] } }, _sum: { amount: true } }),
        payments.payment.aggregate({ where: { status: 'paid', paidDate: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
        payments.payment.findMany({ where: { status: 'pending', dueDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }, include: { tenant: { include: { room: { include: { property: true } } } } }, orderBy: { dueDate: 'asc' }, take: 5 })
      ]);
      paymentsData = { total, pending, paid, overdue, pendingAmount: pendingSum._sum.amount || 0, paidThisMonth: paidSum._sum.amount || 0, upcomingPayments: upcoming as unknown[] };
    } catch { /* Payment model not ready */ }

    // Contratos - con try/catch individual
    let contractsData = { active: 0, expiring: 0, totalDeposit: 0 };
    try {
      const contracts = db as unknown as { contract: { count: (a?: unknown) => Promise<number>; aggregate: (a: unknown) => Promise<{ _sum: { deposit: number | null } }> } };
      const [active, expiring, deposit] = await Promise.all([
        contracts.contract.count({ where: { status: 'active' } }),
        contracts.contract.count({ where: { status: 'active', endDate: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) } } }),
        contracts.contract.aggregate({ where: { status: 'active' }, _sum: { deposit: true } })
      ]);
      contractsData = { active, expiring, totalDeposit: deposit._sum.deposit || 0 };
    } catch { /* Contract model not ready */ }

    return NextResponse.json({
      overview: { totalProperties, totalRooms, totalTenants, totalIncidents, openIncidents, inProgressIncidents },
      rooms: { occupied: occupiedRooms, available: availableRooms, maintenance: maintenanceRooms },
      incidentsByCategory: incidentsByCategory.map(i => ({ category: i.category, count: i._count.id })),
      incidentsByPriority: incidentsByPriority.map(i => ({ priority: i.priority, count: i._count.id })),
      recentIncidents,
      payments: paymentsData,
      contracts: contractsData
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Error al obtener dashboard' }, { status: 500 });
  }
}
