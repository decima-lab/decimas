import { cookies } from "next/headers";
import { signOut } from "@/lib/actions";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1>Admin</h1>
      <p>Logged in as {user?.email}</p>
      <form action={signOut}>
        <button type="submit">Logout</button>
      </form>
    </div>
  );
}
