"use client";

import { useEffect, useState } from "react";
import { Package, Plus, MapPin, Calendar, Clock, MoreVertical, Loader2, Edit, Trash2, Eye, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDonations, createDonation, deleteDonation, updateDonationStatus, editDonation } from "@/app/actions/donations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewDonation, setViewDonation] = useState<any | null>(null);
  const [editDonationData, setEditDonationData] = useState<any | null>(null);
  const role = useAppStore((s) => s.role);

  useEffect(() => {
    fetchDonations();
  }, []);

  async function fetchDonations() {
    setIsLoading(true);
    const data = await getDonations();
    setDonations(data);
    setIsLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await createDonation(formData);
    if (res.success) {
      toast.success("Donation added successfully!");
      setOpen(false);
      // Refresh in the background so closing the dialog isn't gated on it.
      fetchDonations();
    } else {
      toast.error(res.error || "Failed to add donation");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setOpenDropdown(null);
    toast.loading("Deleting donation...", { id: "delete" });
    const res = await deleteDonation(id);
    if (res.success) {
      toast.success("Donation deleted successfully!", { id: "delete" });
      fetchDonations();
    } else {
      toast.error(res.error || "Failed to delete", { id: "delete" });
    }
  }

  async function handleMatch(id: string) {
    setOpenDropdown(null);
    toast.loading("Running AI Matching algorithm...", { id: "match" });
    setTimeout(async () => {
      const res = await updateDonationStatus(id, "matched");
      if (res.success) {
        toast.success("Best NGO Match found! Status updated.", { id: "match" });
        fetchDonations();
      } else {
        toast.error("Failed to match donation", { id: "match" });
      }
    }, 1500);
  }

  async function handleEditSubmit(formData: FormData) {
    setIsSubmitting(true);
    if (editDonationData) {
      const res = await editDonation(editDonationData.id, formData);
      if (res.success) {
        toast.success("Donation updated successfully!");
        fetchDonations();
        setEditDonationData(null);
      } else {
        toast.error("Failed to update donation");
      }
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Donations</h1>
          <p className="text-slate-500">Manage all food donations in the system.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md" />
            }
          >
            <Plus size={18} className="mr-2" /> Add Donation
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Donation</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name (Donor)</Label>
                <Input id="organizationName" name="organizationName" placeholder="e.g. Fresh Foods Supermarket" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Food Title</Label>
                <Input id="title" name="title" placeholder="e.g. Mixed Veg Curry" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Buffet leftovers..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weightKg">Weight (kg)</Label>
                  <Input id="weightKg" name="weightKg" type="number" step="0.1" placeholder="15.5" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input id="servings" name="servings" type="number" placeholder="30" required />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Post Donation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Item Details</th>
                <th className="px-6 py-4 font-medium">Donor Info</th>
                <th className="px-6 py-4 font-medium">Quantity</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Expiry</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No donations found.</td>
                </tr>
              ) : (
                donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{donation.title}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{donation.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{donation.donor?.name || "Unknown"}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <MapPin size={12} className="mr-1" />
                        {donation.donor?.address || "Location hidden"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{donation.servings} Servings</p>
                      <p className="text-xs text-slate-500">{donation.weightKg} kg</p>
                    </td>
                    <td className="px-6 py-4">
                      {donation.status === "available" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-medium rounded-full">Available</Badge>
                      ) : donation.status === "matched" ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-medium rounded-full">Matched</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium rounded-full capitalize">{donation.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-medium flex items-center gap-1">
                        <Clock size={14} className="text-amber-500" />
                        {new Date(donation.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <MoreVertical size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-lg">
                          <DropdownMenuItem onClick={() => setViewDonation(donation)}>
                            <Eye size={16} className="mr-2 text-slate-500" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditDonationData(donation)}>
                            <Edit size={16} className="mr-2 text-slate-500" /> Edit Donation
                          </DropdownMenuItem>
                          {/* We assume role is obtained from useAppStore in this component */}
                          {role === "admin" && (
                            <DropdownMenuItem onClick={() => handleMatch(donation.id)} className="text-blue-600 focus:text-blue-700">
                              <Link2 size={16} className="mr-2" /> Find Match
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(donation.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                            <Trash2 size={16} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={!!viewDonation} onOpenChange={(open) => !open && setViewDonation(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {viewDonation && (
            <div className="space-y-4 pt-4 text-sm">
              <div><strong className="text-slate-700">Title:</strong> {viewDonation.title}</div>
              <div><strong className="text-slate-700">Description:</strong> {viewDonation.description}</div>
              <div><strong className="text-slate-700">Weight:</strong> {viewDonation.weightKg} kg</div>
              <div><strong className="text-slate-700">Servings:</strong> {viewDonation.servings}</div>
              <div className="mt-4 p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <div className="font-semibold text-emerald-700 flex items-center mb-2">
                  <Package className="mr-2" size={16} /> AI Quality Metrics
                </div>
                <div className="text-slate-600 space-y-1">
                  <div><strong>Predicted Shelf Life:</strong> {viewDonation.predictedShelfLife} hours</div>
                  <div><strong>Quality Score:</strong> {viewDonation.qualityScore || 'N/A'}/100</div>
                  <div><strong>CO2 Prevented:</strong> {viewDonation.co2Saved || '0'} kg</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDonationData} onOpenChange={(open) => !open && setEditDonationData(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Donation</DialogTitle>
          </DialogHeader>
          {editDonationData && (
            <form action={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Food Title</Label>
                <Input id="edit-title" name="title" defaultValue={editDonationData.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={editDonationData.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-weightKg">Weight (kg)</Label>
                  <Input id="edit-weightKg" name="weightKg" type="number" step="0.1" defaultValue={editDonationData.weightKg} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-servings">Servings</Label>
                  <Input id="edit-servings" name="servings" type="number" defaultValue={editDonationData.servings} required />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
