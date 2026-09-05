"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Package, MapPin, Calendar, Clock, Weight, Flame, ArrowRight, User, Phone, Loader2, Navigation, CheckCircle2, Leaf } from "lucide-react";
import { getMatchById } from "@/app/actions/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volunteerPhone, setVolunteerPhone] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatch() {
      if (params.id) {
        const data = await getMatchById(params.id as string);
        setMatch(data);
      }
      setIsLoading(false);
    }
    fetchMatch();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Match not found</h2>
        <Button onClick={() => router.push("/dashboard/matches")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Matches
        </Button>
      </div>
    );
  }

  const { donation, ngo, assignedVolunteer } = match;

  // Generates a Tamil Nadu-style mobile number (+91, valid TN circle prefixes)
  const generateTamilNaduPhoneNumber = () => {
    const prefixes = ["90", "91", "94", "95", "96", "97", "98", "99", "63", "73", "81", "82", "83", "89"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    let rest = "";
    for (let i = 0; i < 8; i++) rest += Math.floor(Math.random() * 10);
    const digits = prefix + rest;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  // Generated once and kept stable — no dialer redirect, just displays the number
  const handleCallVolunteer = () => {
    setVolunteerPhone((prev) => prev ?? generateTamilNaduPhoneNumber());
  };

  // Function to get a deterministic food image placeholder based on ID
  const getFoodImage = (title: string = "Food") => {
    const images = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
    ];
    // Simple hash to consistently pick the same image for the same food title
    let hash = 0;
    const safeTitle = title || "Food";
    for (let i = 0; i < safeTitle.length; i++) hash = safeTitle.charCodeAt(i) + ((hash << 5) - hash);
    return images[Math.abs(hash) % images.length];
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{donation?.title}</h1>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              Match ID: <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{match.id}</span>
            </p>
          </div>
        </div>
        {match.status === "completed" ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-semibold rounded-full px-4 py-1.5 text-sm uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={16} /> Completed
          </Badge>
        ) : (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-semibold rounded-full px-4 py-1.5 text-sm uppercase tracking-wider">
            In Progress
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Left Column: Food Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
            <div className="h-64 w-full relative">
              <img 
                src={donation.image || getFoodImage(donation.title)} 
                alt={donation.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge className="bg-black/50 backdrop-blur text-white border-none font-medium px-3 py-1">
                  {donation.category || 'Cooked'}
                </Badge>
                <Badge className="bg-emerald-500 text-white border-none font-medium px-3 py-1 flex items-center gap-1">
                  <Flame size={14} /> {donation.temperature || 'Hot'}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Food Details</h2>
              <p className="text-slate-600 mb-8">{donation.description || "No description provided."}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Package size={16}/> Servings</span>
                  <span className="text-lg font-bold text-slate-800">{donation.servings} plates</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Weight size={16}/> Weight</span>
                  <span className="text-lg font-bold text-slate-800">{donation.weightKg} kg</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Calendar size={16}/> Expires In</span>
                  <span className="text-lg font-bold text-slate-800">{donation.predictedShelfLife || 24} hours</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5"><Leaf size={16}/> CO2 Saved</span>
                  <span className="text-lg font-bold text-emerald-700">{donation.co2Saved || (donation.weightKg * 2.5).toFixed(1)} kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logistics Route Visual */}
          <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Logistics Route</h2>
            <div className="flex flex-col md:flex-row items-center gap-6 justify-between w-full">
              
              {/* Origin */}
              <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 w-full relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border-4 border-slate-50">1</div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Pick Up</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{donation.donor?.name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={12}/> {donation.donor?.address || "Address hidden"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center shrink-0">
                <span className="text-xs font-semibold text-slate-400 mb-1">{match.distance?.toFixed(1) || "5.2"} km</span>
                <div className="w-16 h-0.5 bg-slate-300 relative">
                  <ArrowRight size={16} className="text-slate-400 absolute -right-2 -top-2" />
                </div>
                <span className="text-[10px] font-medium text-blue-500 mt-1 flex items-center gap-1">
                  <Clock size={10} /> ~{match.travelTime || 25} min
                </span>
              </div>

              {/* Destination */}
              <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 w-full relative">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold border-4 border-slate-50">2</div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Drop Off</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{ngo?.name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={12}/> {ngo?.address || "Address hidden"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Right Column: Profiles & Status */}
        <div className="space-y-6">
          {assignedVolunteer && (
             <Card className="rounded-3xl border-slate-200 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl z-0"></div>
                <div className="relative z-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Assigned Volunteer</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                      {assignedVolunteer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{assignedVolunteer.name}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Navigation size={12}/> {assignedVolunteer.vehicle || "Bike"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Button variant="outline" className="flex-1 text-slate-600" onClick={handleCallVolunteer}>
                      <Phone className="w-4 h-4 mr-2" /> Call
                    </Button>
                    {volunteerPhone && (
                      <p className="text-xs text-center font-mono text-slate-500">{volunteerPhone}</p>
                    )}
                  </div>
                </div>
             </Card>
          )}

          <Card className="rounded-3xl border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Quality & Ratings</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Donor Rating</span>
                  <span className="font-bold text-slate-900">{donation.donor?.rating?.toFixed(1) || "5.0"} / 5.0</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(donation.donor?.rating / 5) * 100 || 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">AI Food Quality Score</span>
                  <span className="font-bold text-slate-900">{donation.qualityScore ? (donation.qualityScore * 100).toFixed(0) : "95"}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${donation.qualityScore ? donation.qualityScore * 100 : 95}%` }}></div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
