import { redirect } from "next/navigation";
import AuthForm from "../_components/AuthForm";
import { getUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  if (await getUser()) redirect("/");
  return (
    <div className="fade-in mx-auto max-w-sm space-y-6 pt-6">
      <div>
        <h1 className="text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to see replies and new ads.</p>
      </div>
      <AuthForm mode="login" next={next} />
    </div>
  );
}
