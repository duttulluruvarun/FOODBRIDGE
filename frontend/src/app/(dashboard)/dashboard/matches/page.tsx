"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2, MapPin, Store, Users, Loader2, ArrowRight, Building2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMatches } from "@/app/actions/utilities";

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMatches() {
      const data = await getMatches();
      setMatches(data);
      setIsLoading(false);
    }
    fetchMatches();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Food Matches</h1>
          <p className="text-slate-500">View active and completed logistics routes between donors and recipients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
          </div>
        ) : matches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No active matches found.
          </div>
        ) : (
          matches.map((match) => (
            <Link href={`/dashboard/matches/${match.id}`} key={match.id} className="block transition-transform hover:-translate-y-1">
              <Card className="p-5 rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition flex flex-col gap-4 h-full cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{match.donation?.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{match.donation?.servings} Servings ({match.donation?.weightKg}kg)</p>
                  </div>
                  {match.status === "completed" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-medium rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider shrink-0">Completed</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-medium rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider shrink-0">In Progress</Badge>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/50 mt-auto">
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-emerald-700" />
                    </div>
                    <span className="text-sm font-semibold truncate flex-1 text-slate-700">{match.donation?.donor?.name}</span>
                    <ArrowRight size={14} className="text-slate-400 shrink-0" />
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-amber-700" />
                    </div>
                    <span className="text-sm font-semibold truncate flex-1 text-slate-700">{match.ngo?.name}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pl-10 pr-2 mt-1">
                    <span className="truncate max-w-[45%] flex items-center gap-1">
                      <MapPin size={10} className="shrink-0"/> {match.donation?.donor?.address?.split(',')[0]}
                    </span>
                    <span className="truncate max-w-[45%] flex items-center gap-1 text-right justify-end">
                      <MapPin size={10} className="shrink-0"/> {match.ngo?.address?.split(',')[0]}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
