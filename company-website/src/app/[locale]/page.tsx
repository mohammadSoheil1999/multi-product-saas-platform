import { Hero, HomeSections } from "@/components/home";
import { localeOf } from "@/lib/i18n";
export default async function Home({params}:{params:Promise<{locale:string}>}){const locale=localeOf((await params).locale);return <><Hero locale={locale}/><HomeSections locale={locale}/></>}
