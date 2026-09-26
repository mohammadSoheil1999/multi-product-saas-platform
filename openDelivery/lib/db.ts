import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
const globalDb=globalThis as unknown as {db?:PrismaClient};
export const db=globalDb.db??new PrismaClient({adapter:new PrismaPg({connectionString:env.DATABASE_URL})});
if(env.NODE_ENV!=="production") globalDb.db=db;
