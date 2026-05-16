import { cookies } from "next/headers";
import Link from "next/link";
import { signOut } from "@/lib/actions";
import { createClient } from "@/utils/supabase/server";

export default async function Header() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: role } = user
    ? await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single()
    : { data: null };

  const isAdmin = !!role;

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      {user ? (
        <>
          {isAdmin && <Link href="/admin">Admin</Link>}
          <form action={signOut}>
            <button type="submit">Logout</button>
          </form>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </header>
  );
}
