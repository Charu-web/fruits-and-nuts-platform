"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Compass,
  Navigation,
  ExternalLink,
  Search,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

interface StoreItem {
  id: number;
  name: string;
  addressStreet: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  operatingHours?: Record<string, string> | null;
  outletStatus: "OPEN" | "COMING_SOON" | "TEMPORARILY_CLOSED";
  distanceKm?: number;
}

// Haversine formula to compute distance between two lat/lng coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const FALLBACK_STORES: StoreItem[] = [
  {
    id: 1,
    name: "Fruits & Nuts Flagship Boutique — Sapphire 90 Mall",
    addressStreet: "K-14 Sapphire 90 Mall, Sector 90",
    city: "Gurgaon",
    state: "Haryana",
    postalCode: "122505",
    phone: "+91-8368301495",
    email: "customersupport@fruitsandnuts.co.in",
    latitude: 28.3985,
    longitude: 76.9298,
    outletStatus: "OPEN",
    operatingHours: {
      "Monday - Sunday": "10:00 AM - 09:30 PM",
    },
    googleMapsUrl: "https://maps.google.com/?q=Sapphire+90+Mall+Sector+90+Gurgaon",
  },
  {
    id: 2,
    name: "Fruits & Nuts Boutique — Sector 86 Outlet",
    addressStreet: "Shop No. 5, Ground Floor, Sector 86",
    city: "Gurgaon",
    state: "Haryana",
    postalCode: "122505",
    phone: "+91 7633080180",
    email: "customersupport@fruitsandnuts.co.in",
    latitude: 28.392,
    longitude: 76.938,
    outletStatus: "OPEN",
    operatingHours: {
      "Monday - Sunday": "10:00 AM - 09:30 PM",
    },
    googleMapsUrl: "https://maps.google.com/?q=Sector+86+Gurgaon",
  },
  {
    id: 3,
    name: "Fruits & Nuts Connoisseurs Store — Basant City",
    addressStreet: "D-9 Basant City, Near Le Palm Apartments",
    city: "Ludhiana",
    state: "Punjab",
    postalCode: "141002",
    phone: "+91 9718629866",
    email: "customersupport@fruitsandnuts.co.in",
    latitude: 30.871,
    longitude: 75.812,
    outletStatus: "OPEN",
    operatingHours: {
      "Monday - Sunday": "10:00 AM - 09:00 PM",
    },
    googleMapsUrl: "https://maps.google.com/?q=Basant+City+Ludhiana",
  },
  {
    id: 4,
    name: "Fruits & Nuts Heritage Store & Office — Pindi Street",
    addressStreet: "Sant Tower, Pindi Street",
    city: "Ludhiana",
    state: "Punjab",
    postalCode: "141008",
    phone: "+91 9718629866",
    email: "customersupport@fruitsandnuts.co.in",
    latitude: 30.909,
    longitude: 75.845,
    outletStatus: "OPEN",
    operatingHours: {
      "Monday - Sunday": "10:00 AM - 08:30 PM",
    },
    googleMapsUrl: "https://maps.google.com/?q=Sant+Tower+Pindi+Street+Ludhiana",
  },
  {
    id: 5,
    name: "Fruits & Nuts Experience Center — Majiwada",
    addressStreet: "Balkum Pada, Luxmi Nagar, Majiwada, Near Lodha Crown",
    city: "Thane",
    state: "Maharashtra",
    postalCode: "400601",
    phone: "+91-8368301495",
    email: "customersupport@fruitsandnuts.co.in",
    latitude: 19.2183,
    longitude: 72.9781,
    outletStatus: "COMING_SOON",
    operatingHours: {
      "Grand Opening": "Launching Soon",
    },
    googleMapsUrl: "https://maps.google.com/?q=Balkum+Pada+Majiwada+Thane",
  },
];

export default function StoreLocatorPage() {
  const [stores, setStores] = useState<StoreItem[]>(FALLBACK_STORES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetch("/api/v1/stores");

        if (res.ok) {
          const json = await res.json();
          const storeList = Array.isArray(json.data) ? json.data : json.data?.stores;
          if (Array.isArray(storeList) && storeList.length > 0) {
            setStores(storeList);
          }
        }
      } catch (err) {
        console.error("Failed to fetch store locations", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStores();
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError("Unable to retrieve your location. Please select your city manually.");
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      if (s.city) set.add(s.city);
    });
    return ["All", ...Array.from(set)];
  }, [stores]);

  const displayedStores = useMemo(() => {
    let result = stores.map((s) => {
      let distance: number | undefined = undefined;
      if (userLocation && s.latitude && s.longitude) {
        distance = calculateDistance(userLocation.lat, userLocation.lng, Number(s.latitude), Number(s.longitude));
      }
      return { ...s, distanceKm: distance };
    });

    if (selectedCity !== "All") {
      result = result.filter((s) => s.city.toLowerCase() === selectedCity.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.postalCode.includes(q) ||
          s.addressStreet.toLowerCase().includes(q)
      );
    }

    if (userLocation) {
      result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return result;
  }, [stores, selectedCity, searchQuery, userLocation]);

  return (
    <div className="bg-[#FAF7F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Our Boutiques & Stores" },
          ]}
        />

        <PageHeader
          eyebrow="PHYSICAL BOUTIQUES"
          title="Flagship Stores & Tasting Lounges"
          description="Experience artisanal dry fruit tastings, custom gifting consultations, and instant bespoke hamper assembly at our physical boutiques across India."
        />

        {/* Search & Location Bar */}
        <div className="bg-white rounded-2xl border border-[#DCE5D8] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by city, street, or PIN code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-[#FAF7F0] border border-[#DCE5D8] rounded-xl focus:outline-none focus:border-[#173D2C] text-[#242824] placeholder:text-stone-400"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-xs px-4 py-2.5 bg-[#FAF7F0] border border-[#DCE5D8] rounded-xl font-medium focus:outline-none focus:border-[#173D2C] text-[#242824] cursor-pointer"
            >
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Cities" : c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="px-5 py-2.5 bg-[#173D2C] hover:bg-[#123123] text-[#FAF7F0] text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer border border-[#B89453]/40"
          >
            <Compass className={`w-4 h-4 text-[#B89453] ${isLocating ? "animate-spin" : ""}`} />
            {isLocating ? "Detecting GPS..." : "Find Stores Near Me"}
          </button>
        </div>

        {locationError && (
          <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs text-center">
            {locationError}
          </div>
        )}

        {/* Store Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-white rounded-2xl border border-[#DCE5D8] p-6 animate-pulse space-y-4 shadow-xs" />
            ))}
          </div>
        ) : displayedStores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedStores.map((store) => (
              <div
                key={store.id}
                className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs hover:border-[#B89453] hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-serif font-bold text-[#173D2C] text-lg leading-snug">{store.name}</h3>
                    <Badge variant={store.outletStatus === "OPEN" ? "sage" : "outline"}>
                      {store.outletStatus === "OPEN" ? "Open Now" : "Coming Soon"}
                    </Badge>
                  </div>

                  {store.distanceKm !== undefined && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B89453] bg-[#FAF7F0] px-2.5 py-1 rounded-md border border-[#B89453]/20">
                      <Navigation className="w-3.5 h-3.5" />
                      {store.distanceKm} km away from your location
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-xs text-stone-600 leading-relaxed">
                    <MapPin className="w-4 h-4 text-[#173D2C] shrink-0 mt-0.5" />
                    <span>
                      {store.addressStreet}, {store.city}, {store.state} — {store.postalCode}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-stone-600 pt-3 border-t border-[#DCE5D8]/70">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#173D2C] shrink-0" />
                      <a href={`tel:${store.phone}`} className="text-[#173D2C] hover:text-[#B89453] hover:underline font-mono font-medium">
                        {store.phone}
                      </a>
                    </div>

                    {store.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#173D2C] shrink-0" />
                        <span className="truncate">{store.email}</span>
                      </div>
                    )}

                    {store.operatingHours && (
                      <div className="flex items-start gap-2 pt-1">
                        <Clock className="w-3.5 h-3.5 text-[#173D2C] shrink-0 mt-0.5" />
                        <div>
                          {Object.entries(store.operatingHours).map(([days, hours]) => (
                            <div key={days} className="text-[11px] text-stone-600">
                              <span className="font-semibold text-stone-700">{days}:</span> {hours}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {store.googleMapsUrl && (
                  <div className="pt-3 border-t border-[#DCE5D8]/70">
                    <a
                      href={store.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-[#FAF7F0] hover:bg-[#173D2C] hover:text-white text-[#173D2C] text-xs font-bold rounded-xl text-center transition-all border border-[#DCE5D8] hover:border-[#173D2C] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Get Driving Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#DCE5D8] p-12 text-center space-y-4 shadow-xs">
            <MapPin className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="font-serif font-bold text-[#173D2C] text-lg">No Boutique Outlets Found</h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              We couldn&apos;t find physical stores matching your search. We deliver nationwide with express delivery and fresh packaging.
            </p>
            <Link
              href="/shop"
              className="inline-block px-5 py-2.5 bg-[#173D2C] text-white text-xs font-semibold rounded-xl hover:bg-[#123123]"
            >
              Explore Online Catalogue &rarr;
            </Link>
          </div>
        )}

        {/* Tasting Lounge Concierge Banner */}
        <div className="bg-[#173D2C] rounded-2xl p-6 sm:p-8 text-[#FAF7F0] border border-[#B89453]/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B89453]">
              <Sparkles className="w-3.5 h-3.5" />
              Private Tasting Lounges
            </div>
            <h3 className="font-serif text-2xl font-bold">Visiting with a Corporate or Wedding Gifting Party?</h3>
            <p className="text-xs text-stone-300 max-w-xl">
              Book a bespoke tasting appointment in advance with our master curators. Sample seasonal single-estate batches, custom ribbon palettes, and customized wax seals.
            </p>
          </div>
          <a
            href="https://wa.me/918368301495?text=Hello%20Fruits%20%26%20Nuts,%20I%20would%20like%20to%20book%20a%20private%20boutique%20tasting%20session."
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[#B89453] hover:bg-[#9E7C3E] text-[#173D2C] font-bold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            Book Tasting Session &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
