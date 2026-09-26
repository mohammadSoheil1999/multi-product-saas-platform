import {NextResponse} from "next/server";
import {logger} from "@/lib/logger";
export function ok(data:unknown,status=200){return NextResponse.json({data},{status});}
export function failure(error:unknown){const id=crypto.randomUUID();const code=error instanceof Error?error.message:"INTERNAL_ERROR";logger.error({errorId:id,errorType:code},"request failed");const status=code==="UNAUTHENTICATED"?401:code.includes("FORBIDDEN")?403:code.includes("UNAVAILABLE")||code.includes("CONCURRENT")?409:code.includes("INVALID")||code.includes("REQUIRED")?422:500;return NextResponse.json({error:{id,code:status===500?"INTERNAL_ERROR":code,message:status===500?"Something went wrong.":code}},{status});}
