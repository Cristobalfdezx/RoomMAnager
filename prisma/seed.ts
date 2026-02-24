// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando sembrado de datos...')

  // 1. Crear contraseña encriptada
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 2. Crear Usuario Administrador (o actualizar si existe)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin Supremo',
      password: hashedPassword,
      role: 'admin', // Importante: rol de admin
    },
  })
  console.log(`👤 Usuario creado: ${admin.email} (Password: admin123)`)

  // 3. Crear una Propiedad de prueba
  const property = await prisma.property.create({
    data: {
      name: 'Residencial Las Palmeras',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      description: 'Edificio céntrico reformado',
      rooms: {
        create: [
          {
            number: '101',
            price: 450,
            size: 12,
            status: 'available',
            floor: 1,
            amenities: JSON.stringify(['wifi', 'ac', 'desk']),
          },
          {
            number: '102',
            price: 500,
            size: 15,
            status: 'occupied',
            floor: 1,
            amenities: JSON.stringify(['wifi', 'ac', 'tv']),
          },
        ],
      },
    },
  })
  console.log(`🏠 Propiedad creada: ${property.name} con 2 habitaciones`)

  console.log('✅ Sembrado finalizado correctamente.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })