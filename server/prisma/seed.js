const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Add seed data here as needed
  console.log('Database seeded successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
