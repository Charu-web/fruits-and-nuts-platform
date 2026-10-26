import http from "http";

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(options: http.RequestOptions, postData?: string): Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log("=== STARTING END-TO-END VERIFICATION ===");
  
  // Wait a few seconds for server to be responsive
  let serverReady = false;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await request({ hostname: "localhost", port: 3000, path: "/api/v1/products", method: "GET" });
      if (res.statusCode === 200) {
        serverReady = true;
        console.log("Next.js dev server is ready at http://localhost:3000");
        break;
      }
    } catch {}
    await wait(2000);
  }

  if (!serverReady) {
    console.error("Server did not become ready in time.");
    process.exit(1);
  }

  // 1. Admin Login
  console.log("\n[1] Testing Admin Login...");
  const loginPayload = JSON.stringify({
    email: "fruitsnutswebsite@gmail.com",
    password: "ImperialOwner2026!"
  });

  const loginRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/auth/admin-login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginPayload)
    }
  }, loginPayload);

  console.log("Login HTTP Status:", loginRes.statusCode);
  const loginJson = JSON.parse(loginRes.body);
  console.log("Login Response:", loginJson.success ? "SUCCESS" : loginJson);

  let setCookie = loginRes.headers["set-cookie"];
  let adminCookie = "";
  if (setCookie) {
    adminCookie = Array.isArray(setCookie)
      ? setCookie.map((c) => c.split(";")[0]).join("; ")
      : ((setCookie as unknown as string) || "").split(";")[0];
  }
  console.log("Admin Session Cookie Acquired:", !!adminCookie);

  // 2. Place Customer Order
  console.log("\n[2] Testing Customer Order Placement (/api/v1/checkout/create-order)...");
  const orderPayload = JSON.stringify({
    shippingAddress: {
      recipientName: "Test Royal Customer",
      phone: "9876543210",
      addressLine1: "123 Heritage Lane, Civil Lines",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "India"
    },
    paymentMethod: "COD",
    items: [
      {
        variantId: "kashmiri-mamra-almonds-500g",
        quantity: 2
      }
    ]
  });

  const orderRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/checkout/create-order",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(orderPayload)
    }
  }, orderPayload);

  console.log("Order Creation HTTP Status:", orderRes.statusCode);
  const orderJson = JSON.parse(orderRes.body);
  console.log("Order Creation Result:", orderJson.success ? `SUCCESS - Order #${orderJson.data?.orderNumber}` : orderJson);
  const createdOrderNumber = orderJson.data?.orderNumber;

  // 3. Verify Order in Admin Orders API
  console.log("\n[3] Verifying Order Visibility in Admin Orders (/api/v1/admin/orders)...");
  const adminOrdersRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/admin/orders",
    method: "GET",
    headers: {
      "Cookie": adminCookie
    }
  });

  console.log("Admin Orders HTTP Status:", adminOrdersRes.statusCode);
  const adminOrdersJson = JSON.parse(adminOrdersRes.body);
  const foundOrder = (adminOrdersJson.data || []).find((o: any) => o.orderNumber === createdOrderNumber);
  console.log(`Order #${createdOrderNumber} Found in Admin Panel?`, foundOrder ? "YES! MATCH CONFIRMED" : "NO");
  if (foundOrder) {
    console.log("Admin Order Details:", {
      orderNumber: foundOrder.orderNumber,
      customerName: foundOrder.customerName,
      status: foundOrder.orderStatus,
      paymentMethod: foundOrder.paymentMethod,
      finalPayableAmount: foundOrder.finalPayableAmount
    });
  }

  // 4. Create Product via Admin API
  console.log("\n[4] Creating Product via Admin API (/api/v1/admin/products)...");
  const testSlug = `royal-walnut-test-${Date.now()}`;
  const productPayload = JSON.stringify({
    name: "Royal Kashmiri Snow Walnuts Reserve",
    slug: testSlug,
    skuBase: `SKU-${Date.now()}`.slice(0, 15),
    description: "Cold-harvested organic high-elevation walnut kernels with golden luster.",
    categoryId: 1,
    taxRatePercentage: 5,
    originRegion: "Kashmir Valley",
    isFeatured: true,
    variants: [
      {
        sku: `SKU-${Date.now()}-500G`.slice(0, 20),
        weightGrams: 500,
        unit: "GRAMS",
        packageType: "STAND_UP_POUCH",
        mrp: 1450,
        sellingPrice: 1200,
        initialStock: 50
      }
    ],
    images: [
      {
        storageKey: `products/${testSlug}/primary.jpg`,
        imageUrl: "/images/products/kashmiri-mamra-almonds.jpg",
        altText: "Royal Kashmiri Snow Walnuts Reserve",
        isPrimary: true
      }
    ]
  });

  const createProdRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/admin/products",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(productPayload),
      "Cookie": adminCookie
    }
  }, productPayload);

  console.log("Admin Product Creation HTTP Status:", createProdRes.statusCode);
  const createProdJson = JSON.parse(createProdRes.body);
  console.log("Admin Product Creation Result:", createProdJson.success ? `SUCCESS - Product Created: ${createProdJson.data?.name}` : createProdJson);

  // 5. Verify Product in Public Storefront API
  console.log("\n[5] Verifying Newly Added Product in Public Storefront Catalog (/api/v1/products)...");
  const publicCatalogRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/v1/products?limit=100",
    method: "GET"
  });

  console.log("Public Catalog HTTP Status:", publicCatalogRes.statusCode);
  const publicCatalogJson = JSON.parse(publicCatalogRes.body);
  const catalogList = Array.isArray(publicCatalogJson.data) ? publicCatalogJson.data : (publicCatalogJson.data?.items || []);
  const foundCatalogProduct = catalogList.find((p: any) => p.slug === testSlug || p.name === "Royal Kashmiri Snow Walnuts Reserve");

  console.log(`Newly Created Product Found on Public Website?`, foundCatalogProduct ? "YES! VISIBLE ON CUSTOMER FRONTEND" : "NO");
  if (foundCatalogProduct) {
    console.log("Customer-Facing Product Details:", {
      id: foundCatalogProduct.id,
      name: foundCatalogProduct.name,
      slug: foundCatalogProduct.slug,
      priceRange: foundCatalogProduct.priceRange,
      imageUrl: foundCatalogProduct.images?.[0]?.imageUrl
    });
  }

  console.log("\n=== ALL CRITICAL E2E TESTS COMPLETED ===");
}

run().catch(console.error);
