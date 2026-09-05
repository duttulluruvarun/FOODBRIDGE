"use client";

import { Suspense, useState } from "react";
import { Leaf, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const DEMO_CREDENTIALS: Record<string, { email: string; password: string }> = {
  admin: { email: "admin@foodbridge.com", password: "password123" },
  donor: { email: "donor@foodbridge.com", password: "password123" },
  ngo: { email: "ngo@foodbridge.com", password: "password123" },
};

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "";
  const prefill = DEMO_CREDENTIALS[roleParam];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsSubmitting(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-emerald-600" size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to FoodBridge</h1>
          <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the platform</CardDescription>
          </CardHeader>
          <CardContent>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="admin@foodbridge.com" defaultValue={prefill?.email} className="pl-9 bg-slate-50/50" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/auth/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="password" name="password" type="password" placeholder="••••••••" defaultValue={prefill?.password} className="pl-9 bg-slate-50/50" required />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (
                  <>Sign In <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>

              <div className="text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <Link href="/auth/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
                  Create a profile
                </Link>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
