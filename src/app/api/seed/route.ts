import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

// Función para hashear contraseña (simple para demo)
function hashPassword(password: string): string {
  // En producción usar bcrypt
  return password; // Por ahora simple
}

export async function POST() {
  try {
    // Limpiar datos existentes
    await db.incidentUpdate.deleteMany();
    await db.payment.deleteMany();
    await db.contract.deleteMany();
    await db.incident.deleteMany();
    await db.user.deleteMany();
    await db.tenant.deleteMany();
    await db.room.deleteMany();
    await db.property.deleteMany();

    // Crear propiedades
    const property1 = await db.property.create({
      data: {
        name: 'Calle Mayor 15',
        address: 'Calle Mayor 15, 2º',
        city: 'Madrid',
        postalCode: '28013',
        description: 'Piso luminoso en el centro de Madrid'
      }
    });

    const property2 = await db.property.create({
      data: {
        name: 'Plaza España 8',
        address: 'Plaza España 8, 1º',
        city: 'Madrid',
        postalCode: '28008',
        description: 'Apartamento moderno'
      }
    });

    const property3 = await db.property.create({
      data: {
        name: 'Gran Vía 42',
        address: 'Gran Vía 42, 3º',
        city: 'Madrid',
        postalCode: '28013',
        description: 'Piso reformado'
      }
    });

    // Crear habitaciones
    const rooms = await Promise.all([
      db.room.create({ data: { number: '101', name: 'Habitación Interior', floor: 1, price: 450, size: 12, status: 'occupied', propertyId: property1.id } }),
      db.room.create({ data: { number: '102', name: 'Habitación Exterior', floor: 1, price: 550, size: 15, status: 'occupied', propertyId: property1.id } }),
      db.room.create({ data: { number: '103', name: 'Habitación Grande', floor: 1, price: 600, size: 18, status: 'available', propertyId: property1.id } }),
      db.room.create({ data: { number: '201', name: 'Suite Principal', floor: 2, price: 700, size: 20, status: 'occupied', propertyId: property2.id } }),
      db.room.create({ data: { number: '202', name: 'Habitación Estándar', floor: 2, price: 500, size: 14, status: 'available', propertyId: property2.id } }),
      db.room.create({ data: { number: '301', name: 'Ático', floor: 3, price: 800, size: 25, status: 'occupied', propertyId: property3.id } }),
      db.room.create({ data: { number: '302', name: 'Habitación Básica', floor: 3, price: 450, size: 12, status: 'occupied', propertyId: property3.id } }),
    ]);

    // Crear inquilinos
    const tenants = await Promise.all([
      db.tenant.create({ data: { name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', dni: '12345678A', moveIn: new Date('2024-01-15'), status: 'active', roomId: rooms[0].id } }),
      db.tenant.create({ data: { name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+34 623 456 789', dni: '23456789B', moveIn: new Date('2024-02-01'), status: 'active', roomId: rooms[1].id } }),
      db.tenant.create({ data: { name: 'Ana Martínez', email: 'ana@email.com', phone: '+34 634 567 890', dni: '34567890C', moveIn: new Date('2023-09-01'), status: 'active', roomId: rooms[3].id } }),
      db.tenant.create({ data: { name: 'Pedro Sánchez', email: 'pedro@email.com', phone: '+34 645 678 901', dni: '45678901D', moveIn: new Date('2024-03-01'), status: 'active', roomId: rooms[5].id } }),
      db.tenant.create({ data: { name: 'Laura Díaz', email: 'laura@email.com', phone: '+34 656 789 012', dni: '56789012E', moveIn: new Date('2023-11-15'), status: 'active', roomId: rooms[6].id } }),
    ]);

    // Crear usuarios (admin y inquilinos)
    const password = '123456'; // Contraseña común para demo
    
    // Usuario admin
    await db.user.create({
      data: {
        email: 'admin@roommanager.com',
        password: password,
        name: 'Administrador',
        role: 'admin'
      }
    });

    // Usuarios inquilinos
    for (const tenant of tenants) {
      await db.user.create({
        data: {
          email: tenant.email,
          password: password,
          name: tenant.name,
          role: 'tenant',
          tenantId: tenant.id
        }
      });
    }

    // Crear contratos
    await Promise.all([
      db.contract.create({ data: { contractNumber: 'CTR-2024-001', startDate: new Date('2024-01-15'), endDate: new Date('2025-01-14'), monthlyRent: 450, deposit: 900, depositPaid: true, status: 'active', tenantId: tenants[0].id } }),
      db.contract.create({ data: { contractNumber: 'CTR-2024-002', startDate: new Date('2024-02-01'), endDate: new Date('2025-01-31'), monthlyRent: 550, deposit: 1100, depositPaid: true, status: 'active', tenantId: tenants[1].id } }),
      db.contract.create({ data: { contractNumber: 'CTR-2023-003', startDate: new Date('2023-09-01'), endDate: new Date('2024-08-31'), monthlyRent: 700, deposit: 1400, depositPaid: true, status: 'active', tenantId: tenants[2].id } }),
      db.contract.create({ data: { contractNumber: 'CTR-2024-004', startDate: new Date('2024-03-01'), endDate: new Date('2025-02-28'), monthlyRent: 800, deposit: 1600, depositPaid: true, status: 'active', tenantId: tenants[3].id } }),
      db.contract.create({ data: { contractNumber: 'CTR-2023-005', startDate: new Date('2023-11-15'), endDate: new Date('2024-11-14'), monthlyRent: 450, deposit: 900, depositPaid: true, status: 'active', tenantId: tenants[4].id } }),
    ]);

    // Crear pagos
    const now = new Date();
    for (const tenant of tenants) {
      const room = rooms.find(r => r.id === tenant.roomId);
      if (!room) continue;

      for (let i = -2; i <= 1; i++) {
        const dueDate = new Date(now.getFullYear(), now.getMonth() + i, 5);
        const isPast = i < 0;
        
        await db.payment.create({
          data: {
            amount: room.price,
            concept: 'alquiler',
            status: isPast ? 'paid' : 'pending',
            dueDate: dueDate,
            paidDate: isPast ? dueDate : null,
            paymentMethod: isPast ? 'transfer' : null,
            tenantId: tenant.id
          }
        });
      }
    }

    // Crear incidencias
    await Promise.all([
      db.incident.create({ data: { title: 'Grifo goteando', description: 'El grifo tiene un goteo constante', category: 'plumbing', priority: 'medium', status: 'open', roomId: rooms[0].id, tenantId: tenants[0].id } }),
      db.incident.create({ data: { title: 'Aire acondicionado no enfría', description: 'Solo expulsa aire ambiente', category: 'electrical', priority: 'high', status: 'in_progress', roomId: rooms[3].id, tenantId: tenants[2].id } }),
      db.incident.create({ data: { title: 'Persiana atascada', description: 'No se puede subir ni bajar', category: 'furniture', priority: 'low', status: 'open', roomId: rooms[1].id, tenantId: tenants[1].id } }),
      db.incident.create({ data: { title: 'Humedad en pared', description: 'Mancha de humedad cerca de la ventana', category: 'other', priority: 'high', status: 'open', roomId: rooms[6].id, tenantId: tenants[4].id } }),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Datos de demostración creados',
      users: {
        admin: { email: 'admin@roommanager.com', password: '123456' },
        tenant: { email: 'maria@email.com', password: '123456' }
      }
    });
  } catch (error) {
    console.error('Error en seed:', error);
    return NextResponse.json({ error: 'Error al crear datos' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.incidentUpdate.deleteMany();
    await db.payment.deleteMany();
    await db.contract.deleteMany();
    await db.incident.deleteMany();
    await db.user.deleteMany();
    await db.tenant.deleteMany();
    await db.room.deleteMany();
    await db.property.deleteMany();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
