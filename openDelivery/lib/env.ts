import { z } from "zod";
const schema=z.object({NODE_ENV:z.enum(["development","test","production"]).default("development"),DATABASE_URL:z.string().min(1),AUTH_SECRET:z.string().min(32),APP_URL:z.string().url(),DEFAULT_TENANT_SLUG:z.string().default("default"),REDIS_URL:z.string().optional(),REDIS_TOKEN:z.string().optional(),ABLY_API_KEY:z.string().optional()});
export const env=schema.parse(process.env);
if(env.NODE_ENV==="production"&&(env.AUTH_SECRET.includes("replace")||env.APP_URL.startsWith("http://"))) throw new Error("Unsafe production configuration");
