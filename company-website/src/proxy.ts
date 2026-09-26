import { NextRequest,NextResponse } from "next/server";
const locales=["en","ar","he"];
export function proxy(req:NextRequest){const p=req.nextUrl.pathname;if(p.startsWith("/api")||p.startsWith("/_next")||p.includes("."))return NextResponse.next();if(!locales.some(l=>p===`/${l}`||p.startsWith(`/${l}/`))){const locale=req.cookies.get("locale")?.value||"en";return NextResponse.redirect(new URL(`/${locales.includes(locale)?locale:"en"}${p}`,req.url))}return NextResponse.next()}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
