import prisma from './src/lib/prisma';

// Test if Prisma client has appointmentSharedDocument
async function testPrisma() {
  console.log('Testing Prisma client...');
  
  // This should work if the client is properly generated
  const count = await prisma.appointmentSharedDocument.count();
  console.log('AppointmentSharedDocument count:', count);
}

testPrisma().catch(console.error);
