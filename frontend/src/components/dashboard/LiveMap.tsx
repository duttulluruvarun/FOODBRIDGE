"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LocateFixed } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import { Building2, Home } from "lucide-react";

// Custom icons using React components rendered to static markup
const createCustomIcon = (backgroundColor: string, shape: "square" | "circle", iconNode: React.ReactNode) => {
  const html = ReactDOMServer.renderToStaticMarkup(
    <div className={`w-8 h-8 flex items-center justify-center text-white shadow-md border-2 border-white ${backgroundColor} ${shape === 'circle' ? 'rounded-full' : 'rounded-md'}`}>
      {iconNode}
    </div>
  );

  return L.divIcon({
    html,
    className: "custom-leaflet-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Component to handle user location zooming
function LocateControl() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    map.locate().on("locationfound", function (e) {
      setIsLocating(false);
      map.flyTo(e.latlng, 14, { duration: 1.5 });
    }).on("locationerror", function () {
      setIsLocating(false);
      alert("Could not access your location. Please check your browser permissions.");
    });
  };

  return (
    <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-2">
      <button 
        onClick={handleLocate}
        className="bg-white p-3 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-slate-100 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center group"
        title="Find My Location"
      >
        <LocateFixed size={22} className={isLocating ? "animate-pulse text-emerald-600" : "group-hover:scale-110 transition-transform"} />
      </button>
    </div>
  );
}

export default function LiveMap() {
  const [mounted, setMounted] = useState(false);
  const [sourceIcon, setSourceIcon] = useState<L.DivIcon | null>(null);
  const [destIcon, setDestIcon] = useState<L.DivIcon | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      
      // Create icons on client side only to avoid SSR issues with Leaflet
      setSourceIcon(createCustomIcon("bg-emerald-500", "square", <Building2 size={16} />));
      setDestIcon(createCustomIcon("bg-amber-500", "circle", <Home size={16} />));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted || !sourceIcon || !destIcon) {
    return (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-xl border border-slate-200">
        <p className="text-slate-400 font-medium">Loading Map Data...</p>
      </div>
    );
  }

  // Chennai specific coordinates to match the screenshot
  const source = { lat: 13.0600, lng: 80.2000, label: "Hotel Green Park" };
  const dest = { lat: 13.0200, lng: 80.2500, label: "Helping Hands NGO" };
  const center: [number, number] = [13.0400, 80.2250];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full rounded-xl z-0"
        style={{ zIndex: 0 }}
      >
        <LocateControl />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
      </MapContainer>
    </div>
  );
}
