"use client";

import { Leaf, Mail, Lock, User, Briefcase, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser } from "@/app/actions/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);
    
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/auth");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 py-12">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-emerald-600" size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create a Profile</h1>
          <p className="text-slate-500 mt-2">Join FoodBridge and start making an impact</p>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Fill in your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm mb-6 border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name or Organization Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="name" name="name" placeholder="John Doe / Hope NGO" className="pl-9 bg-slate-50/50" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="email" name="email" type="email" placeholder="email@example.com" className="pl-9 bg-slate-50/50" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <select
                    id="role"
                    name="role"
                    defaultValue=""
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-slate-50/50 px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="donor">Food Donor (Restaurant, Caterer)</option>
                    <option value="ngo">Recipient (NGO, Shelter)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="password" name="password" type="password" placeholder="••••••••" className="pl-9 bg-slate-50/50" required minLength={6} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Re-enter Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" className="pl-9 bg-slate-50/50" required minLength={6} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-6 mt-2">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Account Recovery</h3>
                  <p className="text-xs text-slate-500 mb-4">Set up a security question in case you forget your password.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="securityQuestion">Security Question</Label>
                  <select
                    id="securityQuestion"
                    name="securityQuestion"
                    defaultValue=""
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-slate-50/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="" disabled>Select a question</option>
                    <option value="What is your favorite food?">What is your favorite food?</option>
                    <option value="What city were you born in?">What city were you born in?</option>
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What high school did you attend?">What high school did you attend?</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityAnswer">Your Answer</Label>
                  <Input 
                    id="securityAnswer" 
                    name="securityAnswer" 
                    type="text" 
                    placeholder="Enter your answer" 
                    className="bg-slate-50/50" 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 mt-4">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : (
                  <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>

              <div className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/auth" className="font-semibold text-emerald-600 hover:text-emerald-500">
                  Sign in here
                </Link>
              </div>
              
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
