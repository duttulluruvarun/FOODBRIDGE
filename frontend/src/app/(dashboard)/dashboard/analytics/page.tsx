"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Package, Leaf, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getAnalyticsData } from "@/app/actions/analytics";

const mockTrendData = [
  { name: 'Mon', donations: 12, requests: 8 },
  { name: 'Tue', donations: 19, requests: 12 },
  { name: 'Wed', donations: 15, requests: 15 },
  { name: 'Thu', donations: 22, requests: 18 },
  { name: 'Fri', donations: 28, requests: 20 },
  { name: 'Sat', donations: 35, requests: 25 },
  { name: 'Sun', donations: 42, requests: 30 },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const dbData = await getAnalyticsData();
      setData(dbData);
      setIsLoading(false);
    }
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
          <p className="text-slate-500">Real-time aggregate data from the FoodBridge OS backend.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Package className="text-emerald-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Donations</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.totalDonations || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Matches</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.totalMatches || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <BarChart2 className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Servings</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.totalServings || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Leaf className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Weight (kg)</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.totalWeight || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Donations vs Requests Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip />
                <Area type="monotone" dataKey="donations" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                <Area type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Donation Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Available', value: data?.statusBreakdown?.available || 0 },
                { name: 'Matched', value: data?.statusBreakdown?.matched || 0 },
                { name: 'Completed', value: data?.statusBreakdown?.completed || 0 },
              ]}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
