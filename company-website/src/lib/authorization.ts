import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
export async function getSession(){return auth.api.getSession({headers:await headers()})}
export async function requireUser(){const session=await getSession();if(!session)redirect("/en/login");if((session.user as {status?:string}).status==="SUSPENDED")redirect("/en/forbidden");return session;}
export async function requireAdmin(){const session=await requireUser();if((session.user as {role?:string}).role!=="ADMIN")redirect("/en/forbidden");return session;}
export async function requireSubscriptionAccess(subscriptionId:string){const session=await requireUser();const subscription=await db.subscription.findFirst({where:{id:subscriptionId,userId:session.user.id}});if(!subscription)throw new Error("Not found");return {session,subscription};}
export async function canManageAccount(userId:string){const session=await requireUser();return session.user.id===userId||(session.user as {role?:string}).role==="ADMIN";}
