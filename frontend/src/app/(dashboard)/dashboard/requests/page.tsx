"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, MapPin, Calendar, Clock, MoreVertical, Loader2, Edit, Trash2, CheckCircle, UserPlus, Split, Package, History, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRequests, createRequest, deleteRequest, updateRequestStatus, editRequest, assignVolunteer } from "@/app/actions/requests";
import { getAvailableDonationsForAllocation, getOpenRequestsByPriority, allocateDonation, getAllocationHistory } from "@/app/actions/allocations";
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

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700 hover:bg-red-200",
  medium: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  low: "bg-slate-100 text-slate-600 hover:bg-slate-200",
};

function PriorityBadge({ priority }: { priority: string }) {
  const key = priority || "medium";
  return (
    <Badge className={`rounded-full text-[10px] px-2 py-0.5 font-medium border-none capitalize ${PRIORITY_STYLES[key] || PRIORITY_STYLES.medium}`}>
      {key}
    </Badge>
  );
}

export default function RequestsPage() {
  const role = useAppStore((s) => s.role);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editRequestData, setEditRequestData] = useState<any | null>(null);

  // Split & Allocate
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isLoadingAllocationData, setIsLoadingAllocationData] = useState(false);
  const [availableDonations, setAvailableDonations] = useState<any[]>([]);
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<string>("");
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, number>>({});
  const [isAllocating, setIsAllocating] = useState(false);

  // Split History
  const [activeTab, setActiveTab] = useState<"requests" | "history">("requests");
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setIsLoading(true);
    const data = await getRequests();
    setRequests(data);
    setIsLoading(false);
  }

  async function handleTabChange(tab: "requests" | "history") {
    setActiveTab(tab);
    if (tab === "history") {
      setIsLoadingHistory(true);
      const data = await getAllocationHistory();
      setHistory(data);
      setIsLoadingHistory(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await createRequest(formData);
    if (res.success) {
      toast.success("Request added successfully!");
      await fetchRequests();
      setOpen(false);
    } else {
      toast.error(res.error || "Failed to add request");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setOpenDropdown(null);
    toast.loading("Deleting request...", { id: "delete" });
    const res = await deleteRequest(id);
    if (res.success) {
      toast.success("Request deleted successfully!", { id: "delete" });
      fetchRequests();
    } else {
      toast.error(res.error || "Failed to delete", { id: "delete" });
    }
  }

  async function handleFulfilled(id: string) {
    setOpenDropdown(null);
    toast.loading("Marking as fulfilled...", { id: "fulfill" });
    const res = await updateRequestStatus(id, "fulfilled");
    if (res.success) {
      toast.success("Request marked as fulfilled!", { id: "fulfill" });
      fetchRequests();
    } else {
      toast.error("Failed to update status", { id: "fulfill" });
    }
  }

  async function handleAssign(id: string) {
    setOpenDropdown(null);
    toast.loading("Finding nearest volunteer...", { id: "assign" });
    setTimeout(async () => {
      const res = await assignVolunteer(id);
      if (res.success) {
        toast.success("Volunteer assigned and notified!", { id: "assign" });
        fetchRequests();
      } else {
        toast.error("Failed to assign volunteer", { id: "assign" });
      }
    }, 1500);
  }

  async function handleEditSubmit(formData: FormData) {
    setIsSubmitting(true);
    if (editRequestData) {
      const res = await editRequest(editRequestData.id, formData);
      if (res.success) {
        toast.success("Request updated successfully!");
        fetchRequests();
        setEditRequestData(null);
      } else {
        toast.error("Failed to update request");
      }
    }
    setIsSubmitting(false);
  }

  async function openAllocateDialog() {
    setIsAllocateOpen(true);
    setSelectedDonationId("");
    setAllocationAmounts({});
    setIsLoadingAllocationData(true);
    const [donations, reqs] = await Promise.all([
      getAvailableDonationsForAllocation(),
      getOpenRequestsByPriority(),
    ]);
    setAvailableDonations(donations);
    setOpenRequests(reqs);
    setIsLoadingAllocationData(false);
  }

  const selectedDonation = availableDonations.find((d) => d.id === selectedDonationId);
  const totalAllocated = Object.values(allocationAmounts).reduce((sum, v) => sum + (v || 0), 0);
  const donationServings = selectedDonation?.servings || 0;
  const remaining = donationServings - totalAllocated;

  function setAllocationFor(requestId: string, value: number) {
    setAllocationAmounts((prev) => ({ ...prev, [requestId]: Math.max(0, value) }));
  }

  async function handleConfirmAllocation() {
    if (!selectedDonationId) return;
    setIsAllocating(true);
    try {
      const splits = Object.entries(allocationAmounts)
        .filter(([, servings]) => servings > 0)
        .map(([requestId, servings]) => ({ requestId, servings }));

      const res = await allocateDonation(selectedDonationId, splits);
      if (res.success) {
        toast.success("Donation allocated across requests!");
        setIsAllocateOpen(false);
        setSelectedDonationId("");
        setAllocationAmounts({});
        // Refresh everything this allocation could have changed: the requests
        // table, and the available-donations/open-requests lists so the next
        // time the dialog opens it isn't showing pre-allocation numbers.
        fetchRequests();
        const [donations, reqs] = await Promise.all([
          getAvailableDonationsForAllocation(),
          getOpenRequestsByPriority(),
        ]);
        setAvailableDonations(donations);
        setOpenRequests(reqs);
      } else {
        toast.error(res.error || "Failed to allocate donation");
      }
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Food Requests</h1>
          <p className="text-slate-500">Manage incoming food requests from verified NGOs.</p>
        </div>

        <div className="flex items-center gap-3">
          {role === "admin" && (
            <Dialog open={isAllocateOpen} onOpenChange={setIsAllocateOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" className="rounded-xl" onClick={openAllocateDialog} />
                }
              >
                <Split size={16} className="mr-2" /> Split & Allocate
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Split a Donation Across Requests</DialogTitle>
                </DialogHeader>

                {isLoadingAllocationData ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-emerald-600 h-8 w-8" />
                  </div>
                ) : (
                  <div className="space-y-5 pt-2">
                    <div className="space-y-2">
                      <Label>Available Donation</Label>
                      <Select
                        value={selectedDonationId}
                        onValueChange={(v: string | null) => { setSelectedDonationId(v || ""); setAllocationAmounts({}); }}
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue placeholder="Choose a donation to split" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDonations.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-400">No available donations</div>
                          ) : (
                            availableDonations.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.title} — {d.servings} servings ({d.donor?.name || "Unknown"})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDonation && (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2 text-sm">
                            <Package size={16} className="text-emerald-600" />
                            <span className="font-semibold text-slate-800">{selectedDonation.servings} servings total</span>
                          </div>
                          <span className={`text-sm font-semibold ${remaining < 0 ? "text-red-600" : "text-slate-600"}`}>
                            {totalAllocated} allocated · {remaining} remaining
                          </span>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {openRequests.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-6">No open requests to allocate to.</p>
                          ) : (
                            openRequests.map((req) => {
                              const value = allocationAmounts[req.id] || 0;
                              // A request can never be given more than it actually still needs —
                              // and never more than what's left of the donation to hand out.
                              const cap = Math.min(req.remainingNeeded, Math.max(0, remaining + value));
                              const barPct = req.remainingNeeded > 0 ? Math.min(100, (value / req.remainingNeeded) * 100) : 0;
                              return (
                                <div key={req.id} className="p-3 rounded-xl border border-slate-100">
                                  <div className="flex items-center justify-between mb-2 gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <PriorityBadge priority={req.priority} />
                                        <span className="text-sm font-semibold text-slate-800 truncate">{req.title}</span>
                                      </div>
                                      <p className="text-xs text-slate-500 truncate mt-0.5">
                                        {req.ngo?.name || "Unknown NGO"} · needs {req.remainingNeeded} more
                                      </p>
                                    </div>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={cap}
                                      value={value || ""}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const raw = parseInt(e.target.value) || 0;
                                        setAllocationFor(req.id, Math.min(raw, cap));
                                      }}
                                      className="w-20 h-8 text-right shrink-0"
                                    />
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full transition-all"
                                      style={{ width: `${barPct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <Button
                          onClick={handleConfirmAllocation}
                          disabled={isAllocating || totalAllocated === 0 || remaining < 0}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isAllocating ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : `Confirm Allocation (${totalAllocated} servings)`}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md" />
              }
            >
              <Plus size={18} className="mr-2" /> Request Food
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit Food Request</DialogTitle>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Request Title</Label>
                  <Input id="title" name="title" placeholder="e.g. Dinner for 50 kids" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Details</Label>
                  <Input id="description" name="description" placeholder="Looking for vegetarian meals..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servingsNeeded">Servings Needed (exact quantity)</Label>
                  <Input id="servingsNeeded" name="servingsNeeded" type="number" min={1} placeholder="e.g. 60" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoursNeeded">Needed By (Hours from now)</Label>
                  <Input id="hoursNeeded" name="hoursNeeded" type="number" placeholder="5" required />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Submit Request"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange("requests")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "requests" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => handleTabChange("history")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History size={14} /> Split History
        </button>
      </div>

      {activeTab === "requests" && (
      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Request Details</th>
                <th className="px-6 py-4 font-medium">NGO Info</th>
                <th className="px-6 py-4 font-medium">Quantity</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Needed By</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-emerald-600" />
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No requests found.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{req.title}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{req.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{req.ngo?.name || "Unknown NGO"}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <MapPin size={12} className="mr-1" />
                        {req.ngo?.address || "Location hidden"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900 flex items-center gap-1">
                        <Package size={14} className="text-emerald-600" /> {req.servingsNeeded}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-6 py-4">
                      {req.status === "open" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-medium rounded-full">Open</Badge>
                      ) : req.status === "fulfilled" ? (
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium rounded-full">Fulfilled</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none font-medium rounded-full capitalize">{req.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-medium flex items-center gap-1">
                        <Clock size={14} className="text-amber-500" />
                        {new Date(req.neededBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(req.neededBy).toLocaleDateString()}</p>
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
                          <DropdownMenuItem onClick={() => setEditRequestData(req)}>
                            <Edit size={16} className="mr-2 text-slate-500" /> Edit Request
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFulfilled(req.id)} className="text-emerald-600 focus:text-emerald-700">
                            <CheckCircle size={16} className="mr-2" /> Mark as Fulfilled
                          </DropdownMenuItem>
                          {role === "admin" && (
                            <DropdownMenuItem onClick={() => handleAssign(req.id)} className="text-blue-600 focus:text-blue-700">
                              <UserPlus size={16} className="mr-2" /> Assign Volunteer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(req.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
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
      )}

      {activeTab === "history" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          {isLoadingHistory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-emerald-600 h-8 w-8" />
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No allocations have been made yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <Split size={18} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium flex items-center gap-1">
                        <Building2 size={11} /> From
                      </p>
                      <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">{a.donation?.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">{a.donation?.donor?.name || "Unknown organisation"}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">To</p>
                      <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px]">{a.request?.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">{a.request?.ngo?.name || "Unknown NGO"}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-semibold rounded-full">{a.servings} servings</Badge>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editRequestData} onOpenChange={(open) => !open && setEditRequestData(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          {editRequestData && (
            <form action={handleEditSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Request Title</Label>
                <Input id="edit-title" name="title" defaultValue={editRequestData.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Details</Label>
                <Input id="edit-description" name="description" defaultValue={editRequestData.description} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-servingsNeeded">Servings Needed (exact quantity)</Label>
                <Input id="edit-servingsNeeded" name="servingsNeeded" type="number" min={1} defaultValue={editRequestData.servingsNeeded} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select name="priority" defaultValue={editRequestData.priority || "medium"}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
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
