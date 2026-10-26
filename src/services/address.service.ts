import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { runTransaction } from "@/database/transactions";
import { CreateAddressSchema, UpdateAddressSchema } from "@/lib/validation/address.schema";
import { z } from "zod";

export class AddressService {
  /**
   * Retrieves all saved addresses for a customer.
   */
  static async listAddresses(userId: string) {
    return await db.address.findMany({
      where: { userId },
      orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Retrieves a specific address by ID scoped to the customer.
   */
  static async getAddressById(userId: string, addressId: string) {
    const address = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw AppError.notFound("Address not found in your account.");
    }

    return address;
  }

  /**
   * Creates a new address for the customer, managing default toggles.
   */
  static async createAddress(userId: string, input: z.infer<typeof CreateAddressSchema>) {
    const validated = CreateAddressSchema.parse(input);

    return await runTransaction(async (tx) => {
      // If setting as default shipping, unset previous default shipping address
      if (validated.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }

      // If setting as default billing, unset previous default billing address
      if (validated.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      // If this is the customer's first address, make it default shipping and billing
      const count = await tx.address.count({ where: { userId } });
      const isFirst = count === 0;

      return await tx.address.create({
        data: {
          userId,
          recipientName: validated.recipientName,
          phone: validated.phone,
          addressLine1: validated.addressLine1,
          addressLine2: validated.addressLine2,
          landmark: validated.landmark,
          city: validated.city,
          state: validated.state,
          postalCode: validated.postalCode,
          country: validated.country,
          addressType: validated.addressType,
          isDefaultShipping: validated.isDefaultShipping || isFirst,
          isDefaultBilling: validated.isDefaultBilling || isFirst,
          gstin: validated.gstin,
          companyName: validated.companyName,
        },
      });
    });
  }

  /**
   * Updates an existing address for the customer.
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    input: z.infer<typeof UpdateAddressSchema>
  ) {
    const validated = UpdateAddressSchema.parse(input);

    const existing = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw AppError.notFound("Address not found in your account.");
    }

    return await runTransaction(async (tx) => {
      if (validated.isDefaultShipping) {
        await tx.address.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }

      if (validated.isDefaultBilling) {
        await tx.address.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return await tx.address.update({
        where: { id: addressId },
        data: validated,
      });
    });
  }

  /**
   * Deletes an address from the customer's account.
   */
  static async deleteAddress(userId: string, addressId: string) {
    const existing = await db.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!existing) {
      throw AppError.notFound("Address not found in your account.");
    }

    await db.address.delete({
      where: { id: addressId },
    });

    return { message: "Address deleted successfully" };
  }
}
