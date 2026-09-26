import {auth} from "@/auth";import {headers} from "next/headers";
import {db} from "@/lib/db";
export type Actor={id:string;tenantId:string;role:"BUSINESS"|"COURIER"|"ADMIN"};
export async function requireUser():Promise<Actor>{const session=await auth.api.getSession({headers:await headers()});const u=session?.user as {id?:string;tenantId?:string;role?:Actor["role"]};if(!u?.id||!u.tenantId||!u.role)throw new Error("UNAUTHENTICATED");return {id:u.id,tenantId:u.tenantId,role:u.role};}
export async function requireRole(role:Actor["role"]){const u=await requireUser();if(u.role!==role)throw new Error("FORBIDDEN");return u;}
export const requireBusiness=()=>requireRole("BUSINESS");export const requireCourier=()=>requireRole("COURIER");export const requireAdmin=()=>requireRole("ADMIN");
export async function canViewDelivery(actor:Actor,deliveryId:string){const d=await db.delivery.findFirst({where:{id:deliveryId,tenantId:actor.tenantId},include:{business:{select:{userId:true}},courier:{select:{userId:true}}}});if(!d)return null;if(actor.role==="ADMIN"||d.business.userId===actor.id||d.courier?.userId===actor.id)return d;if(d.status==="AVAILABLE"&&actor.role==="COURIER")return d;return null;}
