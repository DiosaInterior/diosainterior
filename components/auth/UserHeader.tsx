import { getUser } from "@/lib/auth/server";

import { UserMenu } from "./_UserMenu";

export async function UserHeader() {
  const user = await getUser();
  if (!user) return null;

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName =
    fullName.split(" ")[0] || user.email?.split("@")[0] || "";

  const avatarUrl = user.user_metadata?.avatar_url as
    | string
    | undefined;

  return (
    <header className="sticky top-0 z-40 dark-radial border-b border-marfil/8 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 h-14 flex items-center justify-end">
        <UserMenu
          firstName={firstName}
          avatarUrl={avatarUrl}
          email={user.email ?? ""}
        />
      </div>
    </header>
  );
}
