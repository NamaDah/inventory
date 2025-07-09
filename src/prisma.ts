import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
export { Role };