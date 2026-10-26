import db from "@/lib/db";
import { AppError } from "@/lib/errors/app-error";
import { Prisma, StoreStatus } from "@prisma/client";
import {
  CreateStoreInput,
  CreateStoreSchema,
  UpdateStoreInput,
  UpdateStoreSchema,
  StoreQueryInput,
  StoreQuerySchema,
} from "@/lib/validation/store.schema";

export interface StoreWithDistance {
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
  operatingHours: unknown;
  outletStatus: StoreStatus;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  distanceKm: number | null;
}

export class StoreService {
  /**
   * Calculates the great-circle distance between two points in kilometers (Haversine formula).
   */
  static haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth's mean radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Public store search with optional geo-proximity sorting.
   */
  static async getStores(queryInput?: Partial<StoreQueryInput>) {
    const query = StoreQuerySchema.parse(queryInput || {});

    const whereClause: Record<string, unknown> = {};

    if (query.city) {
      whereClause.city = { contains: query.city, mode: "insensitive" };
    }
    if (query.state) {
      whereClause.state = { contains: query.state, mode: "insensitive" };
    }
    if (query.pincode) {
      whereClause.postalCode = query.pincode;
    }
    if (query.status) {
      whereClause.outletStatus = query.status;
    }

    const stores = await db.storeLocation.findMany({
      where: whereClause,
      orderBy: { displayOrder: "asc" },
    });

    // If client supplied user lat/lng, calculate distance and filter/sort
    let resultStores: StoreWithDistance[] = stores.map((store) => {
      let distanceKm: number | null = null;
      if (
        query.lat !== undefined &&
        query.lng !== undefined &&
        store.latitude !== null &&
        store.longitude !== null
      ) {
        distanceKm = this.haversineDistanceKm(
          query.lat,
          query.lng,
          Number(store.latitude),
          Number(store.longitude)
        );
      }
      return {
        id: store.id,
        name: store.name,
        addressStreet: store.addressStreet,
        city: store.city,
        state: store.state,
        postalCode: store.postalCode,
        phone: store.phone,
        email: store.email,
        latitude: store.latitude ? Number(store.latitude) : null,
        longitude: store.longitude ? Number(store.longitude) : null,
        googleMapsUrl: store.googleMapsUrl,
        operatingHours: store.operatingHours,
        outletStatus: store.outletStatus,
        displayOrder: store.displayOrder,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        distanceKm,
      };
    });

    if (query.lat !== undefined && query.lng !== undefined) {
      // Sort by proximity
      resultStores.sort((a: StoreWithDistance, b: StoreWithDistance) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      // Filter by radius if desired
      if (query.radiusKm) {
        resultStores = resultStores.filter(
          (s: StoreWithDistance) => s.distanceKm === null || s.distanceKm <= query.radiusKm
        );
      }
    }

    const total = resultStores.length;
    const page = query.page;
    const limit = query.limit;
    const paginatedStores = resultStores.slice((page - 1) * limit, page * limit);

    return {
      stores: paginatedStores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves a single store by its ID.
   */
  static async getStoreById(id: number) {
    const store = await db.storeLocation.findUnique({
      where: { id },
    });

    if (!store) {
      throw AppError.notFound("StoreLocation", id);
    }

    return {
      ...store,
      latitude: store.latitude ? Number(store.latitude) : null,
      longitude: store.longitude ? Number(store.longitude) : null,
    };
  }

  /**
   * Admin: Creates a new physical store outlet.
   */
  static async createStore(input: CreateStoreInput, adminUserId?: string, ipAddress?: string) {
    const validated = CreateStoreSchema.parse(input);

    const created = await db.storeLocation.create({
      data: {
        name: validated.name,
        addressStreet: validated.addressStreet,
        city: validated.city,
        state: validated.state,
        postalCode: validated.postalCode,
        phone: validated.phone,
        email: validated.email,
        latitude: validated.latitude ?? undefined,
        longitude: validated.longitude ?? undefined,
        googleMapsUrl: validated.googleMapsUrl,
        operatingHours: validated.operatingHours ? (validated.operatingHours as object) : undefined,
        outletStatus: validated.outletStatus,
        displayOrder: validated.displayOrder,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "STORE_LOCATION_CREATED",
        entityName: "StoreLocation",
        entityId: created.id.toString(),
        prevState: Prisma.DbNull,
        newState: {
          name: created.name,
          city: created.city,
          state: created.state,
          outletStatus: created.outletStatus,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return {
      ...created,
      latitude: created.latitude ? Number(created.latitude) : null,
      longitude: created.longitude ? Number(created.longitude) : null,
    };
  }

  /**
   * Admin: Updates an existing store location.
   */
  static async updateStore(
    id: number,
    input: UpdateStoreInput,
    adminUserId?: string,
    ipAddress?: string
  ) {
    const validated = UpdateStoreSchema.parse(input);

    const existing = await db.storeLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound("StoreLocation", id);
    }

    const updated = await db.storeLocation.update({
      where: { id },
      data: {
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.addressStreet !== undefined ? { addressStreet: validated.addressStreet } : {}),
        ...(validated.city !== undefined ? { city: validated.city } : {}),
        ...(validated.state !== undefined ? { state: validated.state } : {}),
        ...(validated.postalCode !== undefined ? { postalCode: validated.postalCode } : {}),
        ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
        ...(validated.email !== undefined ? { email: validated.email } : {}),
        ...(validated.latitude !== undefined ? { latitude: validated.latitude } : {}),
        ...(validated.longitude !== undefined ? { longitude: validated.longitude } : {}),
        ...(validated.googleMapsUrl !== undefined ? { googleMapsUrl: validated.googleMapsUrl } : {}),
        ...(validated.operatingHours !== undefined
          ? { operatingHours: validated.operatingHours ? (validated.operatingHours as object) : undefined }
          : {}),
        ...(validated.outletStatus !== undefined ? { outletStatus: validated.outletStatus } : {}),
        ...(validated.displayOrder !== undefined ? { displayOrder: validated.displayOrder } : {}),
      },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "STORE_LOCATION_UPDATED",
        entityName: "StoreLocation",
        entityId: id.toString(),
        prevState: {
          name: existing.name,
          city: existing.city,
          state: existing.state,
          outletStatus: existing.outletStatus,
        } as Prisma.InputJsonValue,
        newState: {
          name: updated.name,
          city: updated.city,
          state: updated.state,
          outletStatus: updated.outletStatus,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return {
      ...updated,
      latitude: updated.latitude ? Number(updated.latitude) : null,
      longitude: updated.longitude ? Number(updated.longitude) : null,
    };
  }

  /**
   * Admin: Deletes a store location.
   */
  static async deleteStore(id: number, adminUserId?: string, ipAddress?: string) {
    const existing = await db.storeLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound("StoreLocation", id);
    }

    await db.storeLocation.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "STORE_LOCATION_DELETED",
        entityName: "StoreLocation",
        entityId: id.toString(),
        prevState: {
          name: existing.name,
          city: existing.city,
          state: existing.state,
        } as Prisma.InputJsonValue,
        newState: Prisma.DbNull,
        ipAddress,
      },
    });

    return { success: true, message: "Store location deleted successfully." };
  }
}
