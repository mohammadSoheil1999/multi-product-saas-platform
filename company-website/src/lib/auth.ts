import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { sendEmail } from "./email";

const configuredTrustedOrigins=(process.env.AUTH_TRUSTED_ORIGINS||"")
 .split(",")
 .map((origin)=>origin.trim())
 .filter(Boolean);

export const auth=betterAuth({
 database:prismaAdapter(db,{provider:"postgresql"}),
 baseURL:process.env.APP_URL,
 trustedOrigins:process.env.NODE_ENV==="production"
  ? configuredTrustedOrigins
  : (request)=>[
    process.env.APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    request?.headers.get("origin"),
   ],
 secret:process.env.AUTH_SECRET,
 emailAndPassword:{enabled:true,requireEmailVerification:true,sendResetPassword:async({user,url})=>{await sendEmail({to:user.email,template:"reset-password",data:{name:user.name,url}})}},
 emailVerification:{sendOnSignUp:true,autoSignInAfterVerification:true,sendVerificationEmail:async({user,url})=>{await sendEmail({to:user.email,template:"verify-account",data:{name:user.name,url}})}},
 user:{additionalFields:{role:{type:"string",defaultValue:"CLIENT",input:false},status:{type:"string",defaultValue:"ACTIVE",input:false},preferredLanguage:{type:"string",defaultValue:"en"}}},
 session:{expiresIn:60*60*24*30,updateAge:60*60*24},
 advanced:{useSecureCookies:process.env.NODE_ENV==="production",cookiePrefix:"yourcompany"},
 plugins:[nextCookies()]
});
