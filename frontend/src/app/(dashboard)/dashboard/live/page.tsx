export const dynamic = 'force-dynamic';

import { getLiveDashboardMetrics } from "@/lib/services/analytics";
import { getTopDonors } from "@/app/actions/users";
import { forecastTomorrow } from "@/lib/ai/forecast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Truck, Heart, Leaf } from "lucide-react";

export default async function LiveDashboardPage() {
  const [metrics, topDonors, forecast] = await Promise.all([
    getLiveDashboardMetrics(),
    getTopDonors(),
    forecastTomorrow()
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Live Impact Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-green-600">LIVE</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meals Saved</CardTitle>
            <Heart className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mealsSaved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {metrics.totalDonations} donations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Prevented</CardTitle>
            <Leaf className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.co2SavedKg.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">
              Helping our planet breathe
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeVolunteers}</div>
            <p className="text-xs text-muted-foreground">
              Volunteers on the ground now
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Forecast (Tomorrow)</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecast.expectedSurplusMeals} meals</div>
            <p className="text-xs text-muted-foreground text-purple-400 font-semibold">
              Predicted Surplus
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tomorrow's Predictive Insights</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="p-4 bg-muted/50 rounded-lg border border-purple-500/20">
                 <h4 className="font-semibold text-purple-600 mb-2">Demand vs Supply Prediction</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <div className="text-sm text-muted-foreground">Expected Need</div>
                     <div className="text-2xl font-bold">{forecast.expectedNeedMeals} meals</div>
                   </div>
                   <div>
                     <div className="text-sm text-muted-foreground">Expected Supply</div>
                     <div className="text-2xl font-bold">{forecast.expectedSurplusMeals} meals</div>
                   </div>
                 </div>
               </div>
               
               <div>
                 <h4 className="font-medium text-sm mb-2">Trending Food Types</h4>
                 <div className="flex gap-2 flex-wrap">
                   {forecast.topItems.map((item, i) => (
                     <Badge key={i} variant="secondary">{item}</Badge>
                   ))}
                 </div>
               </div>
             </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Food Heroes</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {topDonors.map((donor, i) => (
                 <div key={donor.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                       {i + 1}
                     </div>
                     <div>
                       <div className="font-medium">{donor.name}</div>
                       <div className="text-xs text-muted-foreground flex items-center gap-1">
                         {donor.badges && <Badge variant="outline" className="text-[10px] h-4 py-0 px-1">{donor.badges}</Badge>}
                       </div>
                     </div>
                   </div>
                   <div className="font-bold text-green-600">{donor.points} pts</div>
                 </div>
               ))}
               {topDonors.length === 0 && (
                 <div className="text-sm text-muted-foreground">No donors yet.</div>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
