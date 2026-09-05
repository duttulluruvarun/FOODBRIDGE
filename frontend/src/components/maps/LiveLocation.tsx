import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

export function LiveLocation({ lat, lng, name }: { lat: number, lng: number, name: string }) {
  // A mock component to represent the Mapbox integration for live tracking
  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-0 relative h-[200px] flex items-center justify-center">
        {/* Placeholder for actual Mapbox GL Map */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://maps.wikimedia.org/osm-intl/12/2892/1684.png')] bg-cover bg-center" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <div className="h-4 w-4 bg-primary rounded-full" />
          </div>
          <Badge className="mt-2 flex gap-1 items-center shadow-lg">
            <Navigation className="h-3 w-3" />
            Live: {name}
          </Badge>
          <div className="mt-1 text-xs font-mono text-muted-foreground bg-background/80 px-2 rounded">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Ensure Badge is imported if missing above
import { Badge } from "@/components/ui/badge";
