import { redirect } from "next/navigation";
import { getCurrentUserAndRoles } from "@/lib/auth";
import { ResetPasswordForm } from "./_components/reset-password-form";

export default async function ResetPasswordPage() {
  const { user } = await getCurrentUserAndRoles();
  if (!user) redirect("/login");
  return <ResetPasswordForm />;
}
