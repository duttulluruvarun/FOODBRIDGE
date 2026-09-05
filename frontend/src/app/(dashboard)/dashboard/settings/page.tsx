"use client";

import { useState } from "react";
import { Save, User, MapPin, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/settings";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/useAppStore";

const AVATAR_OPTIONS = [
  "https://github.com/shadcn.png",
  "/avatar-custom.png",
  "/avatar-custom-2.png",
  "/avatar-custom-3.png",
  "/avatar-custom-4.png",
];

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedAvatar = useAppStore((s) => s.avatar);
  const setSelectedAvatar = useAppStore((s) => s.setAvatar);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      const res = await updateProfile(formData);
      if (res?.success) {
        toast.success("Profile updated");
      } else {
        toast.error(res?.error ?? "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl pb-10">
      
      {/* Unique Header Area */}
      <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 p-8 text-white overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            Personalize Your Space
          </h1>
          <p className="text-emerald-100 max-w-lg text-lg">
            Customize your FoodBridge profile, update your preferences, and make this workspace uniquely yours.
          </p>
        </div>
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
          <CardTitle className="text-xl">Profile Identity</CardTitle>
          <CardDescription>Select an avatar that represents you across the FoodBridge network.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          
          {/* Avatar Selector */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="relative">
              <Avatar className="h-28 w-28 ring-4 ring-white shadow-xl overflow-hidden">
                <AvatarImage 
                  src={selectedAvatar} 
                  className={
                    selectedAvatar === "/avatar-custom-2.png" || selectedAvatar === "/avatar-custom-4.png"
                      ? "scale-[1.18]"
                      : ""
                  }
                />
                <AvatarFallback>NK</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                <CheckCircle2 size={18} />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-3">Choose Your Avatar</h3>
              <div className="flex flex-wrap gap-3">
                {AVATAR_OPTIONS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative rounded-full transition-all duration-300 ${
                      selectedAvatar === avatar 
                        ? "ring-4 ring-emerald-500 ring-offset-2 scale-110 shadow-md" 
                        : "ring-2 ring-transparent hover:ring-slate-300 opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <Avatar className="h-12 w-12 border border-slate-200 overflow-hidden">
                      <AvatarImage 
                        src={avatar} 
                        className={
                          avatar === "/avatar-custom-2.png" || avatar === "/avatar-custom-4.png"
                            ? "scale-[1.18]"
                            : ""
                        }
                      />
                    </Avatar>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="name" name="name" className="pl-9" placeholder="Nitin Kannan" defaultValue="Nitin Kannan" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value="admin@foodbridge.os" disabled className="bg-slate-50" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Organization Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input id="address" name="address" className="pl-9" placeholder="Enter your full address" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white mt-6">
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
