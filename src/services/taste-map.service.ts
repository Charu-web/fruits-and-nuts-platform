import db from "@/lib/db";
import { AppError } from "@/lib/errors/app-error";
import { Prisma } from "@prisma/client";
import {
  CreateTasteMapRegionInput,
  CreateTasteMapRegionSchema,
  UpdateTasteMapRegionInput,
  UpdateTasteMapRegionSchema,
  SyncTasteMapProductsInput,
  SyncTasteMapProductsSchema,
} from "@/lib/validation/taste-map.schema";
import { VERIFIED_INDIA_REGIONS } from "@/lib/data/india-taste-regions";
import { STOREFRONT_PRODUCTS } from "@/lib/catalog/storefront-catalog";
import { getProductImageUrl } from "@/lib/catalog/product-asset-registry";

function getFallbackPublicRegions() {
  return VERIFIED_INDIA_REGIONS.map((region) => {
    const products = region.productSlugs
      .map((slug) => STOREFRONT_PRODUCTS.find((p) => p.slug === slug))
      .filter((p): p is (typeof STOREFRONT_PRODUCTS)[number] => Boolean(p))
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        isFeatured: Boolean(p.isBestseller),
        primaryImage: p.primaryImage,
        images: [{ imageUrl: p.primaryImage?.imageUrl || "/images/placeholder-product.svg", altText: p.primaryImage?.altText || p.name, isPrimary: true }],
        variants: (p.variants || []).map((v) => ({
          id: v.id,
          sku: v.sku,
          weightGrams: v.weightGrams,
          unit: v.unit,
          mrp: v.mrp,
          sellingPrice: v.sellingPrice,
        })),
      }));

    return {
      id: region.id,
      stateId: region.stateId,
      name: region.name,
      slug: region.slug,
      state: region.state,
      landmark: region.landmark,
      pinCoordinates: {
        lat: region.coordinates.lat,
        lng: region.coordinates.lng,
        x_pct: Math.round((region.coordinates.svgX / 612) * 100),
        y_pct: Math.round((region.coordinates.svgY / 696) * 100),
        svgX: region.coordinates.svgX,
        svgY: region.coordinates.svgY,
      },
      coordinates: region.coordinates,
      associationType: region.associationType,
      associationLabel: region.associationLabel,
      verificationStatus: region.verificationStatus,
      verificationSource: region.verificationDetails,
      culturalStory: region.culturalStory,
      terroirNotes: region.terroirNotes,
      bannerImageUrl: null,
      displayOrder: region.id,
      products,
    };
  });
}

export class TasteMapService {
  /**
   * Retrieves all published Taste Map regions for public storefront display.
   */
  static async getPublicRegions() {
    try {
      const regions = await db.tasteMapRegion.findMany({
        where: { isPublished: true },
        orderBy: { displayOrder: "asc" },
        include: {
          associations: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  isFeatured: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { imageUrl: true, altText: true },
                  },
                  variants: {
                    where: { isActive: true },
                    orderBy: { sellingPrice: "asc" },
                    take: 1,
                    select: {
                      id: true,
                      sku: true,
                      weightGrams: true,
                      unit: true,
                      mrp: true,
                      sellingPrice: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (regions && regions.length > 0) {
        return regions.map((region: (typeof regions)[number]) => ({
          id: region.id,
          name: region.name,
          slug: region.slug,
          state: region.state,
          pinCoordinates: region.pinCoordinates,
          culturalStory: region.culturalStory,
          verificationSource: region.verificationSource,
          bannerImageUrl: region.bannerImageUrl,
          displayOrder: region.displayOrder,
          products: region.associations.map((assoc: (typeof region.associations)[number]) => {
            const verifiedUrl = getProductImageUrl(assoc.product.slug);
            return {
              ...assoc.product,
              images: verifiedUrl
                ? [{ imageUrl: verifiedUrl, altText: assoc.product.name }]
                : assoc.product.images,
            };
          }),
        }));
      }
    } catch {
      // Graceful fallback to verified in-memory registry when DB is offline
    }

    return getFallbackPublicRegions();
  }

  /**
   * Retrieves a single Taste Map region by its URL slug.
   */
  static async getRegionBySlug(slug: string, publishedOnly = true) {
    try {
      const region = await db.tasteMapRegion.findFirst({
        where: {
          slug,
          ...(publishedOnly ? { isPublished: true } : {}),
        },
        include: {
          associations: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  isFeatured: true,
                  images: {
                    orderBy: { sortOrder: "asc" },
                    select: { id: true, imageUrl: true, altText: true, isPrimary: true },
                  },
                  variants: {
                    where: { isActive: true },
                    orderBy: { sellingPrice: "asc" },
                    select: {
                      id: true,
                      sku: true,
                      weightGrams: true,
                      unit: true,
                      packageType: true,
                      mrp: true,
                      sellingPrice: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (region) {
        return {
          id: region.id,
          name: region.name,
          slug: region.slug,
          state: region.state,
          pinCoordinates: region.pinCoordinates,
          culturalStory: region.culturalStory,
          verificationSource: region.verificationSource,
          bannerImageUrl: region.bannerImageUrl,
          displayOrder: region.displayOrder,
          isPublished: region.isPublished,
          products: region.associations.map((assoc: (typeof region.associations)[number]) => {
            const verifiedUrl = getProductImageUrl(assoc.product.slug);
            return {
              ...assoc.product,
              images: verifiedUrl
                ? [{ imageUrl: verifiedUrl, altText: assoc.product.name }]
                : assoc.product.images,
            };
          }),
        };
      }
    } catch {
      // Graceful fallback to verified in-memory registry when DB is offline
    }

    const fallback = getFallbackPublicRegions().find((r) => r.slug === slug || r.stateId === slug);
    if (!fallback) {
      throw AppError.notFound("TasteMapRegion", slug);
    }

    return fallback;
  }

  /**
   * Admin listing of all Taste Map regions (published and unpublished).
   */
  static async getAdminRegions() {
    const regions = await db.tasteMapRegion.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        associations: {
          include: {
            product: {
              select: { id: true, name: true, skuBase: true, slug: true },
            },
          },
        },
      },
    });

    return regions;
  }

  /**
   * Creates a new Taste Map region with optional initial product associations.
   */
  static async createRegion(input: CreateTasteMapRegionInput, adminUserId?: string, ipAddress?: string) {
    const validated = CreateTasteMapRegionSchema.parse(input);

    const existingSlug = await db.tasteMapRegion.findUnique({
      where: { slug: validated.slug },
    });

    if (existingSlug) {
      throw AppError.conflict(`A Taste Map region with slug '${validated.slug}' already exists.`);
    }

    const { productIds, pinCoordinates, ...regionData } = validated;

    const created = await db.tasteMapRegion.create({
      data: {
        ...regionData,
        pinCoordinates: pinCoordinates as unknown as object,
        associations: {
          create: (productIds || []).map((pId) => ({
            productId: pId,
          })),
        },
      },
      include: {
        associations: {
          include: { product: true },
        },
      },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "TASTE_MAP_REGION_CREATED",
        entityName: "TasteMapRegion",
        entityId: created.id.toString(),
        prevState: Prisma.DbNull,
        newState: {
          name: created.name,
          slug: created.slug,
          state: created.state,
          isPublished: created.isPublished,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return created;
  }

  /**
   * Updates an existing Taste Map region.
   */
  static async updateRegion(
    id: number,
    input: UpdateTasteMapRegionInput,
    adminUserId?: string,
    ipAddress?: string
  ) {
    const validated = UpdateTasteMapRegionSchema.parse(input);

    const existing = await db.tasteMapRegion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound("TasteMapRegion", id);
    }

    if (validated.slug && validated.slug !== existing.slug) {
      const duplicateSlug = await db.tasteMapRegion.findUnique({
        where: { slug: validated.slug },
      });
      if (duplicateSlug) {
        throw AppError.conflict(`Slug '${validated.slug}' is already in use by another region.`);
      }
    }

    const { productIds, pinCoordinates, ...regionData } = validated;

    const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update region details
      const reg = await tx.tasteMapRegion.update({
        where: { id },
        data: {
          ...regionData,
          ...(pinCoordinates ? { pinCoordinates: pinCoordinates as unknown as object } : {}),
        },
      });

      // If productIds explicitly passed, sync associations
      if (productIds !== undefined) {
        await tx.tasteMapAssociation.deleteMany({
          where: { regionId: id },
        });

        if (productIds.length > 0) {
          await tx.tasteMapAssociation.createMany({
            data: productIds.map((pId) => ({
              regionId: id,
              productId: pId,
            })),
          });
        }
      }

      return reg;
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "TASTE_MAP_REGION_UPDATED",
        entityName: "TasteMapRegion",
        entityId: id.toString(),
        prevState: {
          name: existing.name,
          slug: existing.slug,
          state: existing.state,
          isPublished: existing.isPublished,
        } as Prisma.InputJsonValue,
        newState: {
          name: updated.name,
          slug: updated.slug,
          state: updated.state,
          isPublished: updated.isPublished,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return updated;
  }

  /**
   * Synchronizes product associations for a Taste Map region.
   */
  static async syncProductAssociations(
    id: number,
    input: SyncTasteMapProductsInput,
    adminUserId?: string,
    ipAddress?: string
  ) {
    const validated = SyncTasteMapProductsSchema.parse(input);

    const existing = await db.tasteMapRegion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound("TasteMapRegion", id);
    }

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tasteMapAssociation.deleteMany({
        where: { regionId: id },
      });

      if (validated.productIds.length > 0) {
        await tx.tasteMapAssociation.createMany({
          data: validated.productIds.map((productId) => ({
            regionId: id,
            productId,
          })),
        });
      }
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "TASTE_MAP_PRODUCTS_SYNCED",
        entityName: "TasteMapRegion",
        entityId: id.toString(),
        prevState: Prisma.DbNull,
        newState: { productIds: validated.productIds } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return { success: true, message: "Taste Map product associations synchronized successfully." };
  }

  /**
   * Deletes a Taste Map region.
   */
  static async deleteRegion(id: number, adminUserId?: string, ipAddress?: string) {
    const existing = await db.tasteMapRegion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound("TasteMapRegion", id);
    }

    await db.tasteMapRegion.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "TASTE_MAP_REGION_DELETED",
        entityName: "TasteMapRegion",
        entityId: id.toString(),
        prevState: {
          name: existing.name,
          slug: existing.slug,
          state: existing.state,
        } as Prisma.InputJsonValue,
        newState: Prisma.DbNull,
        ipAddress,
      },
    });

    return { success: true, message: "Taste Map region deleted successfully." };
  }
}
