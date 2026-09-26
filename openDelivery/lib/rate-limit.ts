import {Ratelimit} from "@upstash/ratelimit";import {Redis} from "@upstash/redis";import {env} from "@/lib/env";
const redis=env.REDIS_URL&&env.REDIS_TOKEN?new Redis({url:env.REDIS_URL,token:env.REDIS_TOKEN}):null;
const limiters=new Map<string,Ratelimit>();
export async function rateLimit(key:string,limit=20,window:"1 m"|"10 m"="1 m"){if(!redis){if(env.NODE_ENV==="production")throw new Error("RATE_LIMIT_UNAVAILABLE");return;}const cacheKey=`${limit}:${window}`;let limiter=limiters.get(cacheKey);if(!limiter){limiter=new Ratelimit({redis,limiter:Ratelimit.slidingWindow(limit,window),prefix:"od"});limiters.set(cacheKey,limiter)}const r=await limiter.limit(key);if(!r.success)throw new Error("RATE_LIMITED");}
