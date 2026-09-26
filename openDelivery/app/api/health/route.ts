import {db} from "@/lib/db";import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(){try{await db.$queryRaw`SELECT 1`;return NextResponse.json({status:"ok",database:"ok",timestamp:new Date().toISOString()})}catch{return NextResponse.json({status:"degraded",database:"unavailable",timestamp:new Date().toISOString()},{status:503})}}
