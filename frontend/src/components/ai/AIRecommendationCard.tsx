import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Check } from "lucide-react";

interface AIRecommendationCardProps {
  score: number;
  ngoName: string;
  distanceKm: number;
  capacityMatch: string;
}

export function AIRecommendationCard({ score, ngoName, distanceKm, capacityMatch }: AIRecommendationCardProps) {
  const percentage = Math.round(score * 100);
  
  let color = "bg-green-100 text-green-700 border-green-200";
  if (percentage < 70) color = "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (percentage < 50) color = "bg-red-100 text-red-700 border-red-200";

  return (
    <Card className={`border-2 ${percentage >= 85 ? 'border-primary shadow-md' : ''}`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{ngoName}</CardTitle>
        </div>
        <Badge variant="outline" className={`${color} font-bold text-lg px-2 py-1`}>
          {percentage}% Match
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{distanceKm.toFixed(1)} km away</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{capacityMatch}</span>
          </div>
          {percentage >= 85 && (
            <div className="text-primary font-medium mt-2 text-xs uppercase tracking-wider">
              ✨ Best AI Recommendation
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
