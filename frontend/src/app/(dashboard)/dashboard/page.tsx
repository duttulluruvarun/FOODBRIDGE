"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Plus, Package, Users, Link2, MapPin, ChevronRight, Leaf, Loader2, ChevronDown, UploadCloud, Send, Building2, ArrowRight, Cloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { getDashboardStats } from "@/app/actions/dashboard";
import { createDonation } from "@/app/actions/donations";
import { createRequest } from "@/app/actions/requests";
import { toast } from "sonner";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import dynamic from "next/dynamic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store/useAppStore";

const LiveMap = dynamic(() => import('@/components/dashboard/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-xl border border-slate-200">
      <p className="text-slate-400 font-medium flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        Loading Live Map...
      </p>
    </div>
  )
});

// Deterministic PRNG so the same calendar range always regenerates the same "refreshed" numbers.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rangeSeed(range?: DateRange) {
  if (!range?.from) return 1;
  const from = Math.floor(range.from.getTime() / 86400000);
  const to = Math.floor((range.to ?? range.from).getTime() / 86400000);
  return Math.abs((from * 2654435761 + to) % 2147483647) || 1;
}

const areaData = [
  { name: 'Jul 14', value: 40 },
  { name: 'Jul 15', value: 48 },
  { name: 'Jul 16', value: 60 },
  { name: 'Jul 17', value: 45 },
  { name: 'Jul 18', value: 58 },
  { name: 'Jul 19', value: 65 },
  { name: 'Jul 20', value: 80 },
];

const pieData = [
  { name: 'Available', value: 45, color: '#10B981' },
  { name: 'Matched', value: 40, color: '#3B82F6' },
  { name: 'Picked Up', value: 28, color: '#F59E0B' },
  { name: 'Expired', value: 15, color: '#EF4444' },
];

const recentMatchesData = [
  { id: 1, donor: 'Hotel Green Park', recipient: 'Helping Hands NGO', status: 'Completed', time: '20 min ago' },
  { id: 2, donor: 'Spice Route Res...', recipient: 'Hope Shelter', status: 'Completed', time: '1 hr ago' },
  { id: 3, donor: 'Adyar Ananda Bhavan', recipient: 'Akshaya Patra', status: 'In Progress', time: '2 hrs ago' },
  { id: 4, donor: 'Sri Murugan Cat...', recipient: 'Snehadaan Orph...', status: 'Completed', time: '3 hrs ago' },
];

export default function MainDashboard() {
  const role = useAppStore((s) => s.role);
  const name = useAppStore((s) => s.name);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 6, 14),
    to: new Date(2026, 6, 20),
  });
  const [isAddDonationOpen, setIsAddDonationOpen] = useState(false);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRequestFoodOpen, setIsRequestFoodOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  function handlePhotoFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large (max 8MB)");
      return;
    }

    // Downscale + re-encode client-side so the resulting data URL stays well
    // under the server action body-size limit, regardless of the source photo's size.
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Failed to process image");
        URL.revokeObjectURL(objectUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      setUploadedImage(canvas.toDataURL("image/jpeg", 0.75));
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      toast.error("Failed to load image");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  async function loadStats() {
    const res = await getDashboardStats();
    if (res.success) {
      setStats(res.data);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function handleCreateDonation(formData: FormData) {
    setIsSubmittingDonation(true);
    try {
      const description = (formData.get("description") as string)?.trim() || "";
      const pickupLocation = (formData.get("pickupLocation") as string)?.trim() || "";

      const payload = new FormData();
      payload.set("title", description || "Quick Donation");
      payload.set(
        "description",
        pickupLocation ? `Pickup at ${pickupLocation}. ${description}` : description
      );
      payload.set("weightKg", (formData.get("weightKg") as string) || "0");
      payload.set("servings", (formData.get("servings") as string) || "0");
      payload.set("category", (formData.get("category") as string) || "");
      payload.set("status", (formData.get("status") as string) || "");
      payload.set("predictedShelfLife", (formData.get("predictedShelfLife") as string) || "");
      payload.set("imageUrl", uploadedImage || "");

      const res = await createDonation(payload);
      if (res.success) {
        toast.success("Donation published successfully!");
        setIsAddDonationOpen(false);
        setUploadedImage(null);
        // Refresh in the background so closing the dialog isn't gated on it.
        loadStats();
      } else {
        toast.error(res.error || "Failed to publish donation");
      }
    } finally {
      setIsSubmittingDonation(false);
    }
  }

  async function handleCreateRequest(formData: FormData) {
    setIsSubmittingRequest(true);
    try {
      const res = await createRequest(formData);
      if (res.success) {
        toast.success("Food request submitted!");
        setIsRequestFoodOpen(false);
        // Refresh in the background so closing the dialog isn't gated on it.
        loadStats();
      } else {
        toast.error(res.error || "Failed to submit request");
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  // Fallback if pieData is empty. stats is null until loadStats() resolves, so this
  // (and everything derived from it below) must tolerate that — the hooks below must
  // run on every render, including the loading one, so they can't sit behind the
  // `if (isLoading) return` earlier in the file.
  const activePieData = stats?.pieData?.length > 0 ? stats.pieData : pieData;

  const getChartData = (filter: string) => {
    switch(filter) {
      case "Today":
        return [
          { name: '8 AM', value: 5 }, { name: '10 AM', value: 12 }, { name: '12 PM', value: 25 },
          { name: '2 PM', value: 20 }, { name: '4 PM', value: 35 }, { name: '6 PM', value: 30 }, { name: '8 PM', value: 15 }
        ];
      case "This Week":
        return areaData;
      case "This Month":
        return [
          { name: 'Week 1', value: 150 }, { name: 'Week 2', value: 280 },
          { name: 'Week 3', value: 210 }, { name: 'Week 4', value: 350 }
        ];
      case "This Year":
        return [
          { name: 'Jan', value: 500 }, { name: 'Feb', value: 600 }, { name: 'Mar', value: 450 },
          { name: 'Apr', value: 700 }, { name: 'May', value: 650 }, { name: 'Jun', value: 800 }, { name: 'Jul', value: 950 }
        ];
      case "All Time":
        return [
          { name: '2021', value: 1500 }, { name: '2022', value: 2800 },
          { name: '2023', value: 5200 }, { name: '2024', value: 4100 }
        ];
      default:
        return areaData;
    }
  };

  // Regenerate displayed numbers from the existing data whenever the calendar range or
  // time filter changes, so the dashboard reads as freshly updated for the selected period.
  // Memoized so unrelated re-renders (dialog state, form inputs, drag state, etc.) don't
  // re-run this on every keystroke — it only recomputes when its actual inputs change.
  const {
    refreshedChartData,
    refreshedPieData,
    refreshedTotalDonations,
    peopleFed,
    peopleFedDelta,
    co2Prevented,
    co2Delta,
    foodWastePrevented,
    foodWasteDelta,
  } = useMemo(() => {
    const currentChartData = getChartData(timeFilter);

    const daysSpan = dateRange?.from
      ? Math.max(1, differenceInCalendarDays(dateRange.to ?? dateRange.from, dateRange.from) + 1)
      : 7;
    const spanFactor = daysSpan / 7;
    const rand = mulberry32(rangeSeed(dateRange));
    const jitter = (base: number, min = 0.8, max = 1.3) =>
      Math.max(0, Math.round(base * (min + rand() * (max - min))));

    const refreshedChartData = currentChartData.map((point) => ({ ...point, value: jitter(point.value) }));
    const refreshedPieData = activePieData.map((entry: any) => ({ ...entry, value: jitter(entry.value) }));
    const refreshedTotalDonations = refreshedPieData.reduce((sum: number, entry: any) => sum + entry.value, 0);

    const peopleFed = jitter(Math.round(4210 * spanFactor));
    const peopleFedDelta = Math.max(1, Math.round(peopleFed * (0.08 + rand() * 0.07)));
    const co2Prevented = jitter(Math.round(2890 * spanFactor));
    const co2Delta = Math.max(1, Math.round(co2Prevented * (0.08 + rand() * 0.07)));
    const foodWastePrevented = jitter(Math.round(1485 * spanFactor));
    const foodWasteDelta = Math.max(1, Math.round(foodWastePrevented * (0.08 + rand() * 0.07)));

    return {
      refreshedChartData,
      refreshedPieData,
      refreshedTotalDonations,
      peopleFed,
      peopleFedDelta,
      co2Prevented,
      co2Delta,
      foodWastePrevented,
      foodWasteDelta,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, dateRange, activePieData]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-red-500 font-medium">Failed to load dashboard data. Please try refreshing.</p>
      </div>
    );
  }

  const { totalDonations, totalRecipients, successfulMatches, totalFoodSaved, totalCo2Saved, deliveriesToYou, ngoFoodReceivedKg, recentDonations } = stats;

  // Shared between the admin and donor dashboards — same "Add Donation" flow either way.
  const addDonationDialog = (
    <Dialog open={isAddDonationOpen} onOpenChange={setIsAddDonationOpen}>
      <DialogTrigger
        render={
          <Button className="bg-[#05321B] hover:bg-[#074726] text-white rounded-md px-4 shadow-sm h-10" />
        }
      >
        <Plus size={18} className="mr-2" /> Add Donation
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">⚡</span> 30-Second Rapid Food Ingestion
          </DialogTitle>
        </DialogHeader>

        <form action={handleCreateDonation} className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Food Photo (JPG, PNG)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handlePhotoFile(e.target.files?.[0])}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
              onDragLeave={() => setIsDraggingPhoto(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPhoto(false);
                handlePhotoFile(e.dataTransfer.files?.[0]);
              }}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition cursor-pointer ${
                isDraggingPhoto ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              {uploadedImage ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={uploadedImage} alt="Food preview" className="h-24 w-24 rounded-xl object-cover shadow-sm" />
                  <p className="text-sm font-medium text-slate-700">Photo attached</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setUploadedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-red-600 hover:underline font-medium"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                    <UploadCloud className="text-slate-400 h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Drag & drop or click to browse</p>
                  <p className="text-xs text-slate-500 mt-1">AI will automatically detect food details</p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Detected Food Category</Label>
              <Select name="category" defaultValue="cooked">
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cooked">Cooked Food</SelectItem>
                  <SelectItem value="raw">Raw Ingredients</SelectItem>
                  <SelectItem value="packaged">Packaged Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estimated Weight (kg)</Label>
              <Input name="weightKg" placeholder="e.g. 15.5" type="number" step="0.1" min="0" className="h-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Food Description</Label>
            <Input name="description" placeholder="e.g. Mixed vegetable curry and rice from buffet" className="h-10" required />
          </div>

          <div className="space-y-2">
            <Label>Pickup Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input name="pickupLocation" placeholder="Search location..." className="pl-9 h-10" defaultValue="Hotel Green Park, Andheri West" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Servings Count</Label>
              <Input name="servings" placeholder="e.g. 40" type="number" min="0" className="h-10" required />
            </div>
            <div className="space-y-2">
              <Label>Remaining Shelf Life (Hours)</Label>
              <Input name="predictedShelfLife" placeholder="e.g. 4" type="number" min="0" className="h-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Donation Status</Label>
            <Select name="status" defaultValue="available">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="pending">Pending Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-2">
            <Button type="button" variant="outline" className="h-10 px-6 font-medium" onClick={() => { setIsAddDonationOpen(false); setUploadedImage(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingDonation} className="h-10 px-6 bg-[#05321B] hover:bg-[#074726] text-white font-medium">
              {isSubmittingDonation ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Send size={16} className="mr-2" />
              )}
              Publish Donation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (role === "donor") {
    const firstName = name.split(" ")[0] || name;
    const peopleFedDonor = Math.round((totalFoodSaved || 0) * 2.5);

    return (
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Impact</h1>
            <p className="text-slate-500">Thank you for making a difference, {firstName}! 💚</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            {addDonationDialog}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Package size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Your Donations</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalDonations}</h3>
            </div>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Leaf size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Food Donated (kg)</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalFoodSaved}</h3>
            </div>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">People Fed</p>
              <h3 className="text-2xl font-bold text-slate-900">{peopleFedDonor}</h3>
            </div>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Cloud size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">CO₂ Prevented (kg)</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalCo2Saved}</h3>
            </div>
          </Card>
        </div>

        {/* Chart + Donut + Recent Donations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-base font-semibold">Your Donation History</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger
                  nativeButton={false}
                  render={
                    <span className="text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition px-3 py-1 rounded-full cursor-pointer flex items-center gap-1" />
                  }
                >
                  {timeFilter} <ChevronDown size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => setTimeFilter("Today")}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("This Week")}>This Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("This Month")}>This Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("This Year")}>This Year</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("All Time")}>All Time</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={refreshedChartData} key={`${timeFilter}-${rangeSeed(dateRange)}`}>
                  <defs>
                    <linearGradient id="colorValueDonor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" name="Donations" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValueDonor)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-0 text-center shrink-0">
              <CardTitle className="text-base font-semibold">Donations by Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center flex-1 pb-6 pt-4 min-h-0 overflow-y-auto">
              <div className="relative w-40 h-40 flex items-center justify-center mt-2 shrink-0">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={refreshedPieData} innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {refreshedPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-donor-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center z-10 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold leading-none">{refreshedTotalDonations}</span>
                  <p className="text-xs text-slate-500 mt-1">Total</p>
                </div>
              </div>

              <div className="flex flex-col gap-y-3 text-xs w-full px-4 mt-6">
                {refreshedPieData.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      {item.value} <span className="text-slate-500 ml-1 font-normal">({((item.value/refreshedTotalDonations)*100).toFixed(1)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 rounded-2xl border-slate-200 shadow-sm h-[400px] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-base font-semibold">Recent Donations</CardTitle>
              <Link href="/dashboard/donations">
                <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1 pb-6 pr-4">
              {recentDonations?.length > 0 ? recentDonations.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                      {d.image ? (
                        <img src={d.image} alt={d.title || "Donation image"} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-emerald-600" size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm truncate w-40">{d.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString()} • {d.servings} servings
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`rounded-full text-[10px] px-2 py-0.5 font-medium ${
                      d.status === 'completed' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                      d.status === 'matched' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                      'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No recent donations found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (role === "ngo") {
    const peopleFedNgo = Math.round((ngoFoodReceivedKg || 0) * 2.5);

    return (
      <div className="space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Food Network</h1>
            <p className="text-slate-500">Find and claim available food, {name}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />

            <Dialog open={isRequestFoodOpen} onOpenChange={setIsRequestFoodOpen}>
              <DialogTrigger
                render={
                  <Button className="bg-[#05321B] hover:bg-[#074726] text-white rounded-md px-4 shadow-sm h-10" />
                }
              >
                <Plus size={18} className="mr-2" /> Request Food
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Submit Food Request</DialogTitle>
                </DialogHeader>
                <form action={handleCreateRequest} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Request Title</Label>
                    <Input id="title" name="title" placeholder="e.g. Dinner for 50 kids" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Details</Label>
                    <Input id="description" name="description" placeholder="Looking for vegetarian meals..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursNeeded">Needed By (Hours from now)</Label>
                    <Input id="hoursNeeded" name="hoursNeeded" type="number" placeholder="5" required />
                  </div>
                  <Button type="submit" disabled={isSubmittingRequest} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                    {isSubmittingRequest ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Submit Request"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Package size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Available Food (kg)</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalFoodSaved}</h3>
            </div>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Link2 size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Deliveries to You</p>
              <h3 className="text-2xl font-bold text-slate-900">{deliveriesToYou}</h3>
            </div>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">People Fed</p>
              <h3 className="text-2xl font-bold text-slate-900">{peopleFedNgo}</h3>
            </div>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <Leaf size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Food Saved (kg)</p>
              <h3 className="text-2xl font-bold text-slate-900">{ngoFoodReceivedKg}</h3>
            </div>
          </Card>
        </div>

        {/* Chart + Donut + Recent Donations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-5 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-base font-semibold">Available Food Trends</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger
                  nativeButton={false}
                  render={
                    <span className="text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition px-3 py-1 rounded-full cursor-pointer flex items-center gap-1" />
                  }
                >
                  {timeFilter} <ChevronDown size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => setTimeFilter("Today")}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("This Week")}>This Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("This Month")}>This Month</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("This Year")}>This Year</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter("All Time")}>All Time</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-4 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={refreshedChartData} key={`${timeFilter}-${rangeSeed(dateRange)}`}>
                  <defs>
                    <linearGradient id="colorValueNgo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" name="Available" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValueNgo)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[400px]">
            <CardHeader className="pb-0 text-center shrink-0">
              <CardTitle className="text-base font-semibold">Donations by Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center flex-1 pb-6 pt-4 min-h-0 overflow-y-auto">
              <div className="relative w-40 h-40 flex items-center justify-center mt-2 shrink-0">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={refreshedPieData} innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                        {refreshedPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-ngo-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center z-10 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold leading-none">{refreshedTotalDonations}</span>
                  <p className="text-xs text-slate-500 mt-1">Total</p>
                </div>
              </div>

              <div className="flex flex-col gap-y-3 text-xs w-full px-4 mt-6">
                {refreshedPieData.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      {item.value} <span className="text-slate-500 ml-1 font-normal">({((item.value/refreshedTotalDonations)*100).toFixed(1)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 rounded-2xl border-slate-200 shadow-sm h-[400px] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-base font-semibold">Recent Donations</CardTitle>
              <Link href="/dashboard/donations">
                <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1 pb-6 pr-4">
              {recentDonations?.length > 0 ? recentDonations.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                      {d.image ? (
                        <img src={d.image} alt={d.title || "Donation image"} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="text-emerald-600" size={20} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm truncate w-40">{d.title}</h4>
                      <p className="text-xs text-slate-500 truncate w-40">{d.donor?.name || 'Unknown Donor'}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString()} • {d.servings} servings
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={`rounded-full text-[10px] px-2 py-0.5 font-medium ${
                      d.status === 'completed' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                      d.status === 'matched' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                      'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-8">No available donations found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, Nitin! 👋</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-medium flex items-center gap-1.5 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Engine Active
          </Badge>
          <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />

          {addDonationDialog}
        </div>
      </div>

      {/* Row 1: Analytics & Recent Donations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Area Chart */}
        <Card className="lg:col-span-5 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">Donations Overview</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger
                nativeButton={false}
                render={
                  <span className="text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition px-3 py-1 rounded-full cursor-pointer flex items-center gap-1" />
                }
              >
                {timeFilter} <ChevronDown size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setTimeFilter("Today")}>Today</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("This Week")}>This Week</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("This Month")}>This Month</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("This Year")}>This Year</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTimeFilter("All Time")}>All Time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 pt-4 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={refreshedChartData} key={`${timeFilter}-${rangeSeed(dateRange)}`}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip />
                <Area type="monotone" dataKey="value" name="Donations" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="lg:col-span-3 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[400px]">
          <CardHeader className="pb-0 text-center shrink-0">
            <CardTitle className="text-base font-semibold">Donations by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center flex-1 pb-6 pt-4 min-h-0 overflow-y-auto">
            <div className="relative w-40 h-40 flex items-center justify-center mt-2 shrink-0">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={refreshedPieData} innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                      {refreshedPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center z-10 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold leading-none">{refreshedTotalDonations}</span>
                <p className="text-xs text-slate-500 mt-1">Total</p>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-col gap-y-3 text-xs w-full px-4 mt-6">
              {refreshedPieData.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-700">
                    {item.value} <span className="text-slate-500 ml-1 font-normal">({((item.value/refreshedTotalDonations)*100).toFixed(1)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Donations List */}
        <Card className="lg:col-span-4 rounded-2xl border-slate-200 shadow-sm h-[400px] overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">Recent Donations</CardTitle>
            <Link href="/dashboard/donations">
              <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4 overflow-y-auto flex-1 pb-6 pr-4">
            {recentDonations?.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
                    {d.image ? (
                      <img src={d.image} alt={d.title || "Donation image"} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="text-emerald-600" size={20} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm truncate w-40">{d.title}</h4>
                    <p className="text-xs text-slate-500 truncate w-40">{d.donor?.name || 'Unknown Donor'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(d.createdAt).toLocaleDateString()} • {d.servings} servings
                    </p>
                  </div>
                </div>
                <Badge 
                  className={`rounded-full text-[10px] px-2 py-0.5 font-medium ${
                    d.status === 'completed' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' :
                    d.status === 'matched' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                    'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* Row 2: Map & Recent Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Matches */}
        <Card className="lg:col-span-4 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[420px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">Recent Matches</CardTitle>
            <Link href="/dashboard/matches">
              <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 overflow-hidden flex-1 pb-4 pt-1">
            {recentMatchesData.map((match) => (
              <div key={match.id} className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-emerald-700" />
                    </div>
                    <span className="text-sm font-semibold truncate flex-1 text-slate-700">{match.donor}</span>
                    <ArrowRight size={14} className="text-slate-400 shrink-0" />
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-amber-700" />
                    </div>
                    <span className="text-sm font-semibold truncate flex-1 text-slate-700">{match.recipient}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pl-10 pr-2">
                   <span className="text-[11px] text-slate-500 font-medium">{match.time}</span>
                   <Badge className={`rounded-full text-[10px] px-2 py-0 border-0 ${match.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {match.status}
                   </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live Map */}
        <Card className="lg:col-span-5 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[420px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="text-emerald-600" size={18} />
              Active Deliveries
            </CardTitle>
            <Link href="/dashboard/live">
              <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0 m-4 mt-0 mb-4 rounded-xl overflow-hidden relative z-0 border border-slate-200">
            <LiveMap />
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-sm border border-slate-200 rounded-lg p-3 flex justify-between items-center z-[1000]">
               <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-600" />
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-500">Pickup: <span className="font-semibold text-slate-700">Hotel Green Park</span></span>
                     <span className="text-[10px] text-slate-500">Drop-off: <span className="font-semibold text-slate-700">Helping Hands NGO</span></span>
                  </div>
               </div>
               <Badge className="bg-slate-100 text-slate-700 border-slate-200">ETA 20 min</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Impact Summary */}
        <Card className="lg:col-span-3 rounded-2xl border-slate-200 shadow-sm flex flex-col h-[420px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <CardTitle className="text-base font-semibold">Impact Summary</CardTitle>
            <Link href="/dashboard/reports">
              <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View Report</span>
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1 pb-6 pt-4 overflow-y-auto">
            
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                 <Users size={18} className="text-emerald-600" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs text-slate-500 font-medium">People Fed</span>
                 <span className="text-xl font-bold text-slate-800">{peopleFed.toLocaleString()}</span>
                 <span className="text-[10px] text-emerald-600 font-medium">+{peopleFedDelta.toLocaleString()} in range ↑</span>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                 <Cloud size={18} className="text-purple-600" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs text-slate-500 font-medium">CO₂ Prevented (kg)</span>
                 <span className="text-xl font-bold text-slate-800">{co2Prevented.toLocaleString()}</span>
                 <span className="text-[10px] text-emerald-600 font-medium">+{co2Delta.toLocaleString()} kg in range ↑</span>
               </div>
            </div>

            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                 <Trash2 size={18} className="text-blue-600" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs text-slate-500 font-medium">Food Waste Prevented (kg)</span>
                 <span className="text-xl font-bold text-slate-800">{foodWastePrevented.toLocaleString()}</span>
                 <span className="text-[10px] text-emerald-600 font-medium">+{foodWasteDelta.toLocaleString()} kg in range ↑</span>
               </div>
            </div>



          </CardContent>
        </Card>

      </div>

    </div>
  );
}
