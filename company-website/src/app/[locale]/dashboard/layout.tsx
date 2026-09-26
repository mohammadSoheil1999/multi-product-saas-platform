import { DashboardShell } from "@/components/dashboard";
import { localeOf } from "@/lib/i18n";
import { requireUser } from "@/lib/authorization";
import { redirect } from "next/navigation";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  const session = await requireUser();
  if ((session.user as { role?: string }).role === "ADMIN")
    redirect(`/${locale}/admin`);
  return <DashboardShell locale={locale}>{children}</DashboardShell>;
}
