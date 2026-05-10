import { createClient } from "../utils/supabase/server";
import { cookies } from "next/headers";

export async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl gap-3 flex-col items-center justify-between py-50 px-16 bg-white dark:bg-black sm:items-start">
          <div className="text-2xl font-bold dark:text-zinc-400">decimas.</div>
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to decimas, your way to make money online while doing
            nothing.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            coming soon...
          </p>
      </main>
    </div>
  );
}
