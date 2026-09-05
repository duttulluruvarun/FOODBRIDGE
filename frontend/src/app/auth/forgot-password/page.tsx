"use client";

import { useState } from "react";
import { Leaf, Mail, ShieldQuestion, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSecurityQuestion, resetPassword } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const submittedEmail = formData.get("email") as string;
    
    const result = await getSecurityQuestion(submittedEmail);

    if (result.error) {
      setError(result.error);
    } else if (result.question) {
      setEmail(submittedEmail);
      setSecurityQuestion(result.question);
      setStep(2);
    }
    
    setIsSubmitting(false);
  }

  async function handleResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("email", email);

    const password = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    const result = await resetPassword(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setStep(3);
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldQuestion className="text-emerald-600" size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Recovery</h1>
          <p className="text-slate-500 mt-2">Reset your password securely</p>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Find Your Account"}
              {step === 2 && "Security Verification"}
              {step === 3 && "Password Reset Successful"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter your registered email address to continue"}
              {step === 2 && "Answer your security question to set a new password"}
              {step === 3 && "You can now log in with your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="email" name="email" type="email" placeholder="email@example.com" className="pl-9 bg-slate-50/50" required />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Continue"}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetSubmit} className="space-y-6">
                
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl mb-4">
                  <Label className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1 block">Your Security Question</Label>
                  <p className="font-medium text-slate-900">{securityQuestion}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityAnswer">Your Answer</Label>
                  <Input id="securityAnswer" name="securityAnswer" type="text" placeholder="Enter your answer" className="bg-slate-50/50" required />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" className="pl-9 bg-slate-50/50" required minLength={6} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" className="pl-9 bg-slate-50/50" required minLength={6} />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Reset Password"}
                </Button>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h3>
                <p className="text-slate-500 mb-8">Your account is secure and your password has been successfully updated.</p>
                <Link href="/auth">
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11">
                    Return to Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {step !== 3 && (
              <div className="text-center text-sm text-slate-500 mt-6">
                Remember your password?{" "}
                <Link href="/auth" className="font-semibold text-emerald-600 hover:text-emerald-500">
                  Sign in here
                </Link>
              </div>
            )}
            
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
