import { db } from "../lib/db";

async function check() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    console.log("=== USERS IN DATABASE ===");
    console.log(JSON.stringify(users, null, 2));

    const productCount = await db.product.count();
    console.log("\n=== PRODUCT COUNT IN DATABASE ===", productCount);

    const orderCount = await db.order.count();
    console.log("\n=== ORDER COUNT IN DATABASE ===", orderCount);

    if (orderCount > 0) {
      const orders = await db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          user: { select: { email: true, phone: true } },
        },
      });
      console.log("\n=== RECENT ORDERS ===");
      console.log(JSON.stringify(orders, null, 2));
    }
  } catch (err) {
    console.error("Database check error:", err);
  } finally {
    await db.$disconnect();
  }
}

check();
