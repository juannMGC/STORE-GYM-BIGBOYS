const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'bigboysdevs@gmail.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'bigboysdevs@gmail.com',
      name: 'Big Boys Admin',
      auth0Id: 'auth0|69d9843b4a46ebb5bedb1707',
      role: 'ADMIN'
    }
  })
  console.log('OK:', user.email, user.role)
}

main()
  .catch(e => console.error('ERROR:', e.message))
  .finally(() => prisma.$disconnect())