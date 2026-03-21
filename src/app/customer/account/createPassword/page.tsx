import { redirect } from "next/navigation";
import ResetPassword from "@/src/app/components/auth/ResetPassword";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function CreatePasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) redirect("/forgot-password");

  return (
    <main className="min-h-screen flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-nav mb-6">Нова парола</h1>
        <ResetPassword token={token} />
      </div>
    </main>
  );
}
