import { UserHeader } from "@/components/auth/UserHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserHeader />
      {children}
    </>
  );
}
