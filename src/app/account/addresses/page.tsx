"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Phone, Home, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AddressItem {
  id: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  addressType: string;
  isDefaultShipping: boolean;
}

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAddresses() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.addresses) {
            setAddresses(json.data.addresses);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAddresses();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[#DCE5D8] p-6 shadow-xs space-y-6">
      <div className="flex justify-between items-center border-b border-[#DCE5D8]/70 pb-3">
        <h3 className="font-serif font-bold text-[#173D2C] text-xl">Saved Shipping Addresses</h3>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-24 bg-[#FAF7F0] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="p-4 bg-[#FAF7F0] rounded-xl border border-[#DCE5D8] text-xs text-stone-700 space-y-2 relative"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#173D2C]" />
                  <span className="font-bold text-stone-900 text-sm">{addr.recipientName}</span>
                </div>
                <Badge variant="outline" className="uppercase text-[9px]">
                  {addr.addressType}
                </Badge>
              </div>
              <p className="leading-relaxed">{addr.addressLine1}</p>
              {addr.addressLine2 && <p className="leading-relaxed">{addr.addressLine2}</p>}
              <p className="font-medium text-stone-900">
                {addr.city}, {addr.state} — {addr.postalCode}
              </p>
              <div className="flex items-center gap-1.5 text-stone-500 pt-1">
                <Phone className="w-3 h-3 text-[#173D2C]" />
                <span>{addr.phone}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-xs text-stone-400 space-y-1">
          <MapPin className="w-8 h-8 text-stone-300 mx-auto" />
          <p>No saved addresses yet.</p>
          <p className="text-[11px] text-stone-400">
            Addresses entered during checkout will be securely preserved in your address book.
          </p>
        </div>
      )}
    </div>
  );
}
