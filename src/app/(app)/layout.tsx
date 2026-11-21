import { SiteHeader } from "@/components/site-header";
import { requireMember } from "@/lib/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const member = await requireMember();
  return (
    <>
      <SiteHeader member={member} />
      {children}
    </>
  );
}
