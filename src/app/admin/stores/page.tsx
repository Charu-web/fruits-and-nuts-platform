"use client";

import React, { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";

interface StoreLocation {
  id: number;
  name: string;
  addressStreet: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  operatingHours: Record<string, string> | null;
  outletStatus: "OPEN" | "COMING_SOON" | "TEMPORARILY_CLOSED";
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreLocation | null>(null);

  // Store Form Fields
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("Srinagar");
  const [formState, setFormState] = useState("Jammu & Kashmir");
  const [formPostalCode, setFormPostalCode] = useState("190001");
  const [formPhone, setFormPhone] = useState("+91 194 245 8899");
  const [formEmail, setFormEmail] = useState("contact@fruitsandnuts.in");
  const [formLat, setFormLat] = useState<string>("34.0837");
  const [formLng, setFormLng] = useState<string>("74.7973");
  const [formMapsUrl, setFormMapsUrl] = useState("");
  const [formMonSatHours, setFormMonSatHours] = useState("10:00 AM - 9:00 PM");
  const [formSunHours, setFormSunHours] = useState("11:00 AM - 8:00 PM");
  const [formStatus, setFormStatus] = useState<"OPEN" | "COMING_SOON" | "TEMPORARILY_CLOSED">("OPEN");
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [isSubmitting, startSubmitting] = useTransition();

  // Fetch Current User
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.data?.role) {
            setUserRole(data.data.role.name || data.data.role);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user context", err);
      }
    }
    fetchMe();
  }, []);

  const canMutate = ["SUPER_ADMIN", "CONTENT_MGR"].includes(userRole);

  // Fetch Stores
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/admin/stores?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Failed to load stores");
      }
      const data = await res.json();
      setStores(data.data?.stores || data.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load store locations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Client-side Filter
  const filteredStores = stores.filter((s) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.city.toLowerCase().includes(query) ||
      s.state.toLowerCase().includes(query) ||
      s.addressStreet.toLowerCase().includes(query) ||
      s.postalCode.includes(query) ||
      s.phone.includes(query)
    );
  });

  // Open Create Modal
  const openCreateModal = () => {
    setEditingStore(null);
    setFormName("");
    setFormAddress("");
    setFormCity("Srinagar");
    setFormState("Jammu & Kashmir");
    setFormPostalCode("190001");
    setFormPhone("+91 ");
    setFormEmail("");
    setFormLat("");
    setFormLng("");
    setFormMapsUrl("");
    setFormMonSatHours("10:00 AM - 9:00 PM");
    setFormSunHours("11:00 AM - 8:00 PM");
    setFormStatus("OPEN");
    setFormDisplayOrder(stores.length);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (store: StoreLocation) => {
    setEditingStore(store);
    setFormName(store.name);
    setFormAddress(store.addressStreet);
    setFormCity(store.city);
    setFormState(store.state);
    setFormPostalCode(store.postalCode);
    setFormPhone(store.phone);
    setFormEmail(store.email || "");
    setFormLat(store.latitude !== null ? store.latitude.toString() : "");
    setFormLng(store.longitude !== null ? store.longitude.toString() : "");
    setFormMapsUrl(store.googleMapsUrl || "");
    const hours = (store.operatingHours as any) || {};
    setFormMonSatHours(hours.mon_sat || "10:00 AM - 9:00 PM");
    setFormSunHours(hours.sunday || "11:00 AM - 8:00 PM");
    setFormStatus(store.outletStatus);
    setFormDisplayOrder(store.displayOrder);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAddress.trim() || !formCity.trim() || !formPostalCode.trim() || !formPhone.trim()) {
      setError("Please fill out all mandatory store fields.");
      return;
    }

    startSubmitting(async () => {
      setError(null);
      try {
        const payload = {
          name: formName.trim(),
          addressStreet: formAddress.trim(),
          city: formCity.trim(),
          state: formState.trim(),
          postalCode: formPostalCode.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || null,
          latitude: formLat.trim() ? parseFloat(formLat) : null,
          longitude: formLng.trim() ? parseFloat(formLng) : null,
          googleMapsUrl: formMapsUrl.trim() || null,
          operatingHours: {
            mon_sat: formMonSatHours.trim(),
            sunday: formSunHours.trim(),
          },
          outletStatus: formStatus,
          displayOrder: Number(formDisplayOrder),
        };

        let res: Response;
        if (editingStore) {
          res = await fetch(`/api/v1/admin/stores/${editingStore.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          res = await fetch("/api/v1/admin/stores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to save store location");
        }

        setSuccessMessage(
          editingStore
            ? `Store "${formName}" updated successfully!`
            : `New store location "${formName}" created successfully!`
        );
        setIsModalOpen(false);
        fetchStores();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to submit store form");
      }
    });
  };

  // Fast Status Change
  const handleStatusChange = (store: StoreLocation, newStatus: "OPEN" | "COMING_SOON" | "TEMPORARILY_CLOSED") => {
    startSubmitting(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/stores/${store.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outletStatus: newStatus }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to update status");
        }

        setSuccessMessage(`Outlet "${store.name}" status updated to ${newStatus}!`);
        fetchStores();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to update outlet status");
      }
    });
  };

  // Handle Delete Store
  const handleDeleteStore = (store: StoreLocation) => {
    const confirmDel = window.confirm(
      `Are you sure you want to delete store outlet "${store.name}" in ${store.city}? This action is logged.`
    );
    if (!confirmDel) return;

    startSubmitting(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/admin/stores/${store.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || "Failed to delete store");
        }

        setSuccessMessage(`Store "${store.name}" deleted.`);
        fetchStores();
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        setError(err.message || "Failed to delete store");
      }
    });
  };

  // KPI calculations
  const openCount = stores.filter((s) => s.outletStatus === "OPEN").length;
  const comingSoonCount = stores.filter((s) => s.outletStatus === "COMING_SOON").length;
  const closedCount = stores.filter((s) => s.outletStatus === "TEMPORARILY_CLOSED").length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              Store Directory & Retail Outlets
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Physical Outlets & Boutiques
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Authoritative management of physical flagship boutiques, regional retail outlets, corporate offices, operating hours, and location directory.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/stores"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm"
          >
            <svg className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Store Locator
          </Link>

          <button
            onClick={openCreateModal}
            disabled={!canMutate}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
              canMutate
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Store Location
          </button>
        </div>
      </div>

      {/* Role Notice */}
      {!canMutate && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong>Read-Only View:</strong> Your role ({userRole}) has view-only permissions for stores. Modifying outlets requires <code className="font-mono font-semibold">SUPER_ADMIN</code> or <code className="font-mono font-semibold">CONTENT_MGR</code> authorization.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMessage}
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-medium">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* KPI Stats Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Listed Outlets</span>
          <p className="mt-3 text-2xl font-bold text-neutral-900">{stores.length}</p>
          <div className="mt-2 text-xs text-neutral-500">All registered physical presences</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Open & Operating</span>
          <p className="mt-3 text-2xl font-bold text-emerald-600">{openCount}</p>
          <div className="mt-2 text-xs text-emerald-600 font-medium">Welcoming walk-in customers</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Upcoming Locations</span>
          <p className="mt-3 text-2xl font-bold text-blue-600">{comingSoonCount}</p>
          <div className="mt-2 text-xs text-neutral-500">New flagship fit-out in progress</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Temporarily Closed</span>
          <p className="mt-3 text-2xl font-bold text-amber-600">{closedCount}</p>
          <div className="mt-2 text-xs text-neutral-500">Renovation or maintenance</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by store name, city, address, PIN code..."
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="COMING_SOON">Coming Soon</option>
              <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm text-neutral-600">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-6 py-3.5">Store & Address</th>
                <th className="px-6 py-3.5">City & State</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5">Operating Hours</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Order</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <svg className="mx-auto h-6 w-6 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="mt-2 block text-xs">Loading store outlets...</span>
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <svg className="mx-auto h-8 w-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="mt-2 block font-medium">No store locations found.</span>
                    <span className="text-xs text-neutral-400">Click "Add Store Location" to register an outlet.</span>
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => {
                  const hours = (store.operatingHours as any) || {};
                  return (
                    <tr key={store.id} className="hover:bg-neutral-50/70 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-900">{store.name}</div>
                        <div className="text-xs text-neutral-500">{store.addressStreet}</div>
                        <div className="text-[11px] font-mono text-neutral-400">PIN: {store.postalCode}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-800">{store.city}</div>
                        <div className="text-xs text-neutral-500">{store.state}</div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-neutral-600">
                        <div>{store.phone}</div>
                        {store.email && <div className="text-[11px] text-neutral-400">{store.email}</div>}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-600">
                        <div>Mon-Sat: {hours.mon_sat || "10:00 AM - 9:00 PM"}</div>
                        <div className="text-neutral-400">Sun: {hours.sunday || "11:00 AM - 8:00 PM"}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.outletStatus === "OPEN" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Open
                          </span>
                        )}
                        {store.outletStatus === "COMING_SOON" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Coming Soon
                          </span>
                        )}
                        {store.outletStatus === "TEMPORARILY_CLOSED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Closed
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center font-mono text-xs text-neutral-500">
                        {store.displayOrder}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(store)}
                            disabled={!canMutate}
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              canMutate
                                ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                            }`}
                          >
                            Edit
                          </button>

                          {canMutate && (
                            <select
                              value={store.outletStatus}
                              onChange={(e) => handleStatusChange(store, e.target.value as any)}
                              className="rounded border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700 focus:outline-none"
                            >
                              <option value="OPEN">Mark Open</option>
                              <option value="COMING_SOON">Mark Coming Soon</option>
                              <option value="TEMPORARILY_CLOSED">Mark Closed</option>
                            </select>
                          )}

                          <button
                            onClick={() => handleDeleteStore(store)}
                            disabled={!canMutate}
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE OR EDIT STORE LOCATION */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">
                    {editingStore ? `Edit Outlet: ${editingStore.name}` : "Add New Store Location"}
                  </h3>
                  <p className="text-xs text-neutral-500">Configure address, PIN code, contact details, and operating schedule.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">Store / Boutique Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Flagship Experience Center (Residency Road)"
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Street Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="e.g. Shop No. 12-14, Heritage Square, Residency Road"
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">City</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">State</label>
                  <input
                    type="text"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">PIN Code (6 Digits)</label>
                  <input
                    type="text"
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value)}
                    placeholder="190001"
                    pattern="[1-9][0-9]{5}"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Contact Phone Number</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 194 245 8899"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Store Email (Optional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="residency@fruitsandnuts.in"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Mon - Sat Operating Hours</label>
                  <input
                    type="text"
                    value={formMonSatHours}
                    onChange={(e) => setFormMonSatHours(e.target.value)}
                    placeholder="10:00 AM - 9:00 PM"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Sunday Operating Hours</label>
                  <input
                    type="text"
                    value={formSunHours}
                    onChange={(e) => setFormSunHours(e.target.value)}
                    placeholder="11:00 AM - 8:00 PM"
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Outlet Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="OPEN">OPEN (Active Boutique)</option>
                    <option value="COMING_SOON">COMING_SOON (Upcoming Fit-out)</option>
                    <option value="TEMPORARILY_CLOSED">TEMPORARILY_CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Display Order</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Latitude (Optional)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    placeholder="34.0837"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">Longitude (Optional)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    placeholder="74.7973"
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-mono text-neutral-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">Google Maps Direction URL (Optional)</label>
                <input
                  type="url"
                  value={formMapsUrl}
                  onChange={(e) => setFormMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {editingStore ? "Update Store Location" : "Save Store Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
