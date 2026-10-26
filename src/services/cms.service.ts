import db from "@/lib/db";
import { AppError } from "@/lib/errors/app-error";
import { Prisma } from "@prisma/client";
import {
  CreateCMSSectionInput,
  CreateCMSSectionSchema,
  UpdateCMSSectionInput,
  UpdateCMSSectionSchema,
  UpdatePublishStatusInput,
  UpdatePublishStatusSchema,
} from "@/lib/validation/cms.schema";

export class CMSService {
  /**
   * Retrieves published CMS sections for public storefront rendering.
   * If specific keys are passed, only those sections are fetched.
   */
  static async getPublishedSections(keys?: string[]) {
    const whereClause: Record<string, unknown> = {
      isPublished: true,
    };

    if (keys && keys.length > 0) {
      whereClause.sectionKey = { in: keys };
    }

    try {
      const sections = await db.cMSSection.findMany({
        where: whereClause,
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          sectionKey: true,
          title: true,
          contentJson: true,
          displayOrder: true,
          updatedAt: true,
        },
      });

      // Return as a key-indexed map for direct client lookups
      const sectionMap: Record<string, unknown> = {};
      for (const sec of sections) {
        sectionMap[sec.sectionKey] = sec;
      }

      return {
        sections,
        sectionMap,
      };
    } catch (error) {
      console.warn("[CMSService] Database unreachable, serving fallback defaults:", error instanceof Error ? error.message : error);
      return {
        sections: [],
        sectionMap: {},
      };
    }
  }

  /**
   * Retrieves a single published CMS section by its sectionKey.
   */
  static async getPublishedSectionByKey(sectionKey: string) {
    const section = await db.cMSSection.findFirst({
      where: {
        sectionKey,
        isPublished: true,
      },
    });

    if (!section) {
      throw AppError.notFound("CMSSection", sectionKey);
    }

    return section;
  }

  /**
   * Admin: Retrieves all CMS sections (published and draft).
   */
  static async getAllSections() {
    const sections = await db.cMSSection.findMany({
      orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    });

    return sections;
  }

  /**
   * Admin: Retrieves a single CMS section by key regardless of publish status.
   */
  static async getSectionByKey(sectionKey: string) {
    const section = await db.cMSSection.findUnique({
      where: { sectionKey },
    });

    if (!section) {
      throw AppError.notFound("CMSSection", sectionKey);
    }

    return section;
  }

  /**
   * Admin: Creates a new CMS section.
   */
  static async createSection(input: CreateCMSSectionInput, adminUserId?: string, ipAddress?: string) {
    const validated = CreateCMSSectionSchema.parse(input);

    const existing = await db.cMSSection.findUnique({
      where: { sectionKey: validated.sectionKey },
    });

    if (existing) {
      throw AppError.conflict(`A CMS section with key '${validated.sectionKey}' already exists.`);
    }

    const created = await db.cMSSection.create({
      data: {
        sectionKey: validated.sectionKey,
        title: validated.title,
        contentJson: validated.contentJson as object,
        isPublished: validated.isPublished,
        displayOrder: validated.displayOrder,
      },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "CMS_SECTION_CREATED",
        entityName: "CMSSection",
        entityId: created.id,
        prevState: Prisma.DbNull,
        newState: {
          sectionKey: created.sectionKey,
          title: created.title,
          isPublished: created.isPublished,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return created;
  }

  /**
   * Admin: Upserts a CMS section by sectionKey.
   */
  static async upsertSection(
    sectionKey: string,
    input: UpdateCMSSectionInput,
    adminUserId?: string,
    ipAddress?: string
  ) {
    const validated = UpdateCMSSectionSchema.parse(input);

    const existing = await db.cMSSection.findUnique({
      where: { sectionKey },
    });

    const result = await db.cMSSection.upsert({
      where: { sectionKey },
      create: {
        sectionKey,
        title: validated.title ?? null,
        contentJson: validated.contentJson ? (validated.contentJson as object) : {},
        isPublished: validated.isPublished ?? true,
        displayOrder: validated.displayOrder ?? 0,
      },
      update: {
        ...(validated.title !== undefined ? { title: validated.title } : {}),
        ...(validated.contentJson !== undefined ? { contentJson: validated.contentJson as object } : {}),
        ...(validated.isPublished !== undefined ? { isPublished: validated.isPublished } : {}),
        ...(validated.displayOrder !== undefined ? { displayOrder: validated.displayOrder } : {}),
      },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: existing ? "CMS_SECTION_UPDATED" : "CMS_SECTION_CREATED",
        entityName: "CMSSection",
        entityId: result.id,
        prevState: existing
          ? ({
              sectionKey: existing.sectionKey,
              title: existing.title,
              isPublished: existing.isPublished,
            } as Prisma.InputJsonValue)
          : Prisma.DbNull,
        newState: {
          sectionKey: result.sectionKey,
          title: result.title,
          isPublished: result.isPublished,
        } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return result;
  }

  /**
   * Admin: Updates publish status of a section.
   */
  static async updatePublishStatus(
    sectionKey: string,
    input: UpdatePublishStatusInput,
    adminUserId?: string,
    ipAddress?: string
  ) {
    const validated = UpdatePublishStatusSchema.parse(input);

    const existing = await db.cMSSection.findUnique({
      where: { sectionKey },
    });

    if (!existing) {
      throw AppError.notFound("CMSSection", sectionKey);
    }

    const updated = await db.cMSSection.update({
      where: { sectionKey },
      data: { isPublished: validated.isPublished },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "CMS_SECTION_PUBLISH_TOGGLED",
        entityName: "CMSSection",
        entityId: updated.id,
        prevState: { isPublished: existing.isPublished } as Prisma.InputJsonValue,
        newState: { isPublished: updated.isPublished } as Prisma.InputJsonValue,
        ipAddress,
      },
    });

    return updated;
  }

  /**
   * Admin: Deletes a CMS section.
   */
  static async deleteSection(sectionKey: string, adminUserId?: string, ipAddress?: string) {
    const existing = await db.cMSSection.findUnique({
      where: { sectionKey },
    });

    if (!existing) {
      throw AppError.notFound("CMSSection", sectionKey);
    }

    await db.cMSSection.delete({
      where: { sectionKey },
    });

    await db.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "CMS_SECTION_DELETED",
        entityName: "CMSSection",
        entityId: existing.id,
        prevState: {
          sectionKey: existing.sectionKey,
          title: existing.title,
        } as Prisma.InputJsonValue,
        newState: Prisma.DbNull,
        ipAddress,
      },
    });

    return { success: true, message: `CMS section '${sectionKey}' deleted successfully.` };
  }
}
