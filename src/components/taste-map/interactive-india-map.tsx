"use client";

import React, { useState } from "react";
import {
  INDIA_MAP_LOCATIONS,
  INDIA_MAP_VIEWBOX,
  IndiaMapLocation,
} from "@/lib/data/india-map-data";
import {
  VERIFIED_INDIA_REGIONS,
  VerifiedTasteRegion,
} from "@/lib/data/india-taste-regions";
import { MapPin, Sparkles, ShieldCheck, Compass, Info } from "lucide-react";

interface InteractiveIndiaMapProps {
  selectedRegionSlug: string | null;
  onSelectRegion: (region: VerifiedTasteRegion | null, stateId?: string, stateName?: string) => void;
  selectedStateId?: string | null;
}

export function InteractiveIndiaMap({
  selectedRegionSlug,
  onSelectRegion,
  selectedStateId,
}: InteractiveIndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<{
    id: string;
    name: string;
    region?: VerifiedTasteRegion;
    x: number;
    y: number;
  } | null>(null);

  // Map state ID ('jk', 'kl', 'ga', etc.) to verified region
  const regionByStateId = React.useMemo(() => {
    const map = new Map<string, VerifiedTasteRegion>();
    for (const r of VERIFIED_INDIA_REGIONS) {
      map.set(r.stateId, r);
    }
    return map;
  }, []);

  const selectedRegion = React.useMemo(() => {
    return VERIFIED_INDIA_REGIONS.find((r) => r.slug === selectedRegionSlug) || null;
  }, [selectedRegionSlug]);

  const effectiveSelectedStateId = selectedRegion?.stateId || selectedStateId || "jk";

  const handleStateClick = (loc: IndiaMapLocation) => {
    const region = regionByStateId.get(loc.id) || null;
    onSelectRegion(region, loc.id, loc.name);
  };

  const handlePinClick = (e: React.MouseEvent, region: VerifiedTasteRegion) => {
    e.stopPropagation();
    onSelectRegion(region, region.stateId, region.state);
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Map Card Header with Real Geography Subtitle */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#173D2C] ring-4 ring-[#B89453]/30" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#173D2C]">
            Interactive India Terroir Map
          </span>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-[#E5EDE5] text-[#173D2C] font-semibold border border-[#8FA89B]/40">
            36 States & UTs
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#B89453]" />
            Verified Harvest
          </span>
          <span className="text-stone-300">•</span>
          <span>Click any state or pin</span>
        </div>
      </div>

      {/* SVG Container: Scaled cleanly with 612 x 696 viewBox */}
      <div className="relative w-full max-w-[560px] aspect-[612/696] bg-[#FAF8F5] rounded-3xl border border-[#DCE5D8] p-3 sm:p-5 shadow-xs overflow-hidden flex items-center justify-center select-none">
        {/* Subtle Map Grid / Watermark Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#B89453_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

        {/* Compass Rose Accent */}
        <div className="absolute top-4 right-4 text-stone-300 pointer-events-none hidden sm:flex flex-col items-center opacity-60">
          <Compass className="w-8 h-8 text-[#B89453]/60 animate-spin-slow" />
          <span className="text-[9px] font-bold tracking-widest text-[#173D2C]/60 mt-0.5">NORTH</span>
        </div>

        <svg
          viewBox={INDIA_MAP_VIEWBOX}
          className="w-full h-full drop-shadow-sm transition-all duration-300"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Interactive Map of India showing verified regional specialities"
          role="img"
        >
          <defs>
            {/* Glow Filter for Selected State */}
            <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#B89453" floodOpacity="0.45" />
            </filter>
            <filter id="state-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* 1. Base State Paths */}
          <g id="india-states-layer">
            {INDIA_MAP_LOCATIONS.map((loc) => {
              const isSelected = effectiveSelectedStateId === loc.id;
              const hasVerifiedRegion = regionByStateId.has(loc.id);
              const isHovered = hoveredState?.id === loc.id;

              // Color resolution:
              // - Selected: Rich Forest Green with gold border
              // - Verified Region (non-selected): Warm sage-ivory with green border
              // - Standard State (neutral): Warm parchment contour
              let fillColor = "#F3EFE6";
              let strokeColor = "#D5CEBE";
              let strokeWidth = 0.9;

              if (isSelected) {
                fillColor = "#173D2C";
                strokeColor = "#B89453";
                strokeWidth = 2.2;
              } else if (isHovered) {
                fillColor = hasVerifiedRegion ? "#B89453" : "#E2DDD0";
                strokeColor = hasVerifiedRegion ? "#173D2C" : "#9E9585";
                strokeWidth = 1.4;
              } else if (hasVerifiedRegion) {
                fillColor = "#E0EBE0";
                strokeColor = "#527853";
                strokeWidth = 1.2;
              }

              return (
                <path
                  key={loc.id}
                  id={`state-${loc.id}`}
                  d={loc.path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isSelected ? "url(#gold-glow)" : "url(#state-shadow)"}
                  className="transition-colors duration-200 cursor-pointer focus:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`${loc.name}${hasVerifiedRegion ? " (Verified Speciality Available)" : ""}`}
                  aria-pressed={isSelected}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const region = regionByStateId.get(loc.id);
                    setHoveredState({
                      id: loc.id,
                      name: loc.name,
                      region,
                      x: rect.x + rect.width / 2,
                      y: rect.y + rect.height / 2,
                    });
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleStateClick(loc)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleStateClick(loc);
                    }
                  }}
                />
              );
            })}
          </g>

          {/* 2. State Highlight Outlines (Render active state on top for clean edges) */}
          {effectiveSelectedStateId && (
            <g id="selected-state-overlay" pointerEvents="none">
              {(() => {
                const loc = INDIA_MAP_LOCATIONS.find((l) => l.id === effectiveSelectedStateId);
                if (!loc) return null;
                return (
                  <path
                    d={loc.path}
                    fill="none"
                    stroke="#B89453"
                    strokeWidth={2.4}
                    strokeLinejoin="round"
                    filter="url(#gold-glow)"
                  />
                );
              })()}
            </g>
          )}

          {/* 3. Verified Regional Terroir Pins */}
          <g id="regional-pins-layer">
            {VERIFIED_INDIA_REGIONS.map((region) => {
              const isSelected = effectiveSelectedStateId === region.stateId;
              const { svgX, svgY } = region.coordinates;

              return (
                <g
                  key={region.id}
                  transform={`translate(${svgX}, ${svgY})`}
                  onClick={(e) => handlePinClick(e as any, region)}
                  className="cursor-pointer group focus:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${region.name} verified products`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectRegion(region, region.stateId, region.state);
                    }
                  }}
                >
                  {/* Outer Pulsing Halo */}
                  {isSelected && (
                    <circle
                      r={14}
                      fill="#B89453"
                      opacity={0.35}
                      className="animate-ping origin-center"
                    />
                  )}

                  {/* Steady Outer Ring */}
                  <circle
                    r={isSelected ? 10 : 7}
                    fill={isSelected ? "#B89453" : "#173D2C"}
                    stroke="#FAF7F0"
                    strokeWidth={1.8}
                    className="transition-all duration-300 drop-shadow-md group-hover:scale-125"
                  />

                  {/* Inner Core Point */}
                  <circle
                    r={isSelected ? 4 : 2.5}
                    fill={isSelected ? "#173D2C" : "#B89453"}
                    className="transition-all duration-300"
                  />

                  {/* Subtle Label on Pin */}
                  <text
                    y={isSelected ? -14 : -10}
                    textAnchor="middle"
                    className={`text-[9px] font-sans font-bold transition-all duration-200 pointer-events-none select-none ${
                      isSelected
                        ? "fill-[#173D2C] opacity-100 font-extrabold"
                        : "fill-[#173D2C]/80 opacity-0 group-hover:opacity-100"
                    }`}
                    style={{ textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}
                  >
                    {region.state}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredState && (
          <div
            className="absolute z-20 pointer-events-none bg-[#173D2C] text-[#FAF7F0] text-xs px-3 py-1.5 rounded-xl shadow-lg border border-[#B89453]/40 flex items-center gap-2 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${Math.min(Math.max((hoveredState.x / (typeof window !== "undefined" ? window.innerWidth : 600)) * 100, 20), 80)}%`,
              top: "24px",
            }}
          >
            {hoveredState.region ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#B89453]" />
                <span className="font-bold">{hoveredState.name}</span>
                <span className="text-[10px] text-[#B89453] bg-[#B89453]/10 px-1.5 py-0.2 rounded font-medium">
                  {hoveredState.region.productSlugs.length} Harvest{hoveredState.region.productSlugs.length > 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5 text-stone-300" />
                <span className="font-medium text-stone-200">{hoveredState.name}</span>
                <span className="text-[10px] text-stone-400">Exploring harvest</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Interactive Legend */}
      <div className="w-full max-w-[560px] mt-4 p-3.5 bg-white rounded-2xl border border-[#DCE5D8] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#173D2C] ring-2 ring-[#B89453]" />
          <span className="font-semibold text-[#173D2C]">Selected State</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#E0EBE0] border border-[#527853]" />
          <span className="text-stone-700">Verified Terroir Region</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#F3EFE6] border border-[#D5CEBE]" />
          <span className="text-stone-500">Other Territories</span>
        </div>
      </div>
    </div>
  );
}
