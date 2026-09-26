import { notFound } from "next/navigation";
import { Footer, Navbar } from "@/components/site";
import { isRtl, localeOf, locales } from "@/lib/i18n";
import { LocaleTranslator } from "@/components/locale-translator";
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const raw=(await params).locale;if(!locales.includes(raw as never))notFound();const locale=localeOf(raw);return <div lang={locale} dir={isRtl(locale)?"rtl":"ltr"} data-locale={locale}><LocaleTranslator locale={locale}/><Navbar locale={locale}/><main>{children}</main><Footer locale={locale}/></div>}
