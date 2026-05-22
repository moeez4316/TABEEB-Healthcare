const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.appointmentPayment.deleteMany({
    where: { paymentStatus: 'UNPAID' }
  });
  console.log('Deleted UNPAID payments to reset idempotency state');
}

main().finally(() => prisma.$disconnect());
