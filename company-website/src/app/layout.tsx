import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@/config/brand";
export const metadata: Metadata={metadataBase:new URL(process.env.APP_URL||"http://localhost:3000"),title:{default:`${brand.companyName} — Digital Business Systems`,template:`%s | ${brand.companyName}`},description:"Professional websites, mobile applications and ready-to-launch SaaS systems.",openGraph:{type:"website",title:brand.companyName,description:brand.companyTagline},twitter:{card:"summary_large_image"}};
const themeScript=`(()=>{try{const saved=localStorage.getItem("theme");const theme=saved==="light"||saved==="dark"?saved:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch{document.documentElement.dataset.theme="dark"}})()`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
