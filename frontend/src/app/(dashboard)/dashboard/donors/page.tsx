"use client";

import { useEffect, useState } from "react";
import { Store, MapPin, Mail, Loader2, MoreVertical, Eye, MessageSquare, Ban, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUsersByRole, sendMessageToUser, deleteUser } from "@/app/actions/users";
import { toast } from "sonner";

export default function DonorsPage() {
  const [donors, setDonors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileDonor, setProfileDonor] = useState<any | null>(null);
  const [messageDonor, setMessageDonor] = useState<any | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDonors();
  }, []);

  async function fetchDonors() {
    setIsLoading(true);
    const data = await getUsersByRole("donor");
    setDonors(data);
    setIsLoading(false);
  }

  async function handleSendMessage() {
    if (!messageDonor) return;
    setIsSendingMessage(true);
    try {
      const res = await sendMessageToUser(messageDonor.id, messageText);
      if (res.success) {
        toast.success(`Message sent to ${messageDonor.name}`);
        setMessageDonor(null);
        setMessageText("");
      } else {
        toast.error(res.error || "Failed to send message");
      }
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleSuspend(donor: any) {
    setOpenDropdown(null);
    setSuspendingId(donor.id);
    try {
      const res = await deleteUser(donor.id);
      if (res.success) {
        toast.success(`${donor.name} has been suspended`);
        setDonors((prev) => prev.filter((d) => d.id !== donor.id));
      } else {
        toast.error(res.error || "Failed to suspend account");
      }
    } finally {
      setSuspendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Food Donors</h1>
          <p className="text-slate-500">Manage verified restaurants, supermarkets, and catering partners.</p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Donor Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No donors found.</td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Store size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{donor.name}</p>
                          <Badge className="bg-slate-100 text-slate-600 border-none font-medium text-[10px] mt-1">Verified Partner</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 flex items-center gap-1">
                        <Mail size={14} className="text-slate-400" /> {donor.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {donor.address || "No address provided"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-slate-600 relative z-10"
                        onClick={() => setOpenDropdown(openDropdown === donor.id ? null : donor.id)}
                        disabled={suspendingId === donor.id}
                      >
                        {suspendingId === donor.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <MoreVertical size={18} />
                        )}
                      </Button>

                      {openDropdown === donor.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenDropdown(null)}
                          />
                          <div className="absolute right-8 top-10 z-50 w-48 rounded-lg bg-white p-2 shadow-xl ring-1 ring-slate-200 focus:outline-none">
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 mb-1 text-left">Actions</div>

                            <button
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left font-medium"
                              onClick={() => { setProfileDonor(donor); setOpenDropdown(null); }}
                            >
                              <Eye size={16} className="text-slate-500" /> View Profile
                            </button>
                            <button
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-left font-medium"
                              onClick={() => { setMessageDonor(donor); setMessageText(""); setOpenDropdown(null); }}
                            >
                              <MessageSquare size={16} className="text-slate-500" /> Message Donor
                            </button>

                            <div className="my-1 border-t border-slate-100"></div>

                            <button
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                              onClick={() => handleSuspend(donor)}
                            >
                              <Ban size={16} /> Suspend Account
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Profile Dialog */}
      <Dialog open={!!profileDonor} onOpenChange={(open) => !open && setProfileDonor(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Donor Profile</DialogTitle>
          </DialogHeader>
          {profileDonor && (
            <div className="space-y-4 pt-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Store size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{profileDonor.name}</p>
                  <Badge className="bg-slate-100 text-slate-600 border-none font-medium text-[10px]">Verified Partner</Badge>
                </div>
              </div>
              <div className="space-y-2 text-slate-700">
                <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {profileDonor.email}</div>
                <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {profileDonor.contactNumber || "Not provided"}</div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {profileDonor.address || "No address provided"}</div>
                <div className="flex items-center gap-2"><Star size={14} className="text-amber-500" /> {profileDonor.rating?.toFixed(1) ?? "5.0"} rating</div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
                Member since {new Date(profileDonor.createdAt).toLocaleDateString('en-IN')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={!!messageDonor} onOpenChange={(open) => !open && setMessageDonor(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Message {messageDonor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSendingMessage || !messageText.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSendingMessage ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
