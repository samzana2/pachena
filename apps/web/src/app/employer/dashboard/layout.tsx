import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmployerProvider } from "@/contexts/EmployerContext";
import EmployerDashboardShell from "@/components/employer-dashboard/EmployerDashboardShell";

export default async function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <EmployerProvider>
      <EmployerDashboardShell>{children}</EmployerDashboardShell>
    </EmployerProvider>
  );
}
