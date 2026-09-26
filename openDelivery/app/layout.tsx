import "./globals.css";import type {Metadata} from "next";import {LanguageSwitcher} from "@/components/LanguageSwitcher";
export const metadata:Metadata={title:"OpenDelivery — Independent Courier Marketplace",description:"Connect your business with independent couriers nearby.",manifest:"/manifest.webmanifest"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LanguageSwitcher/>{children}</body></html>}
