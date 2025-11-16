import { storage } from "./storage";

async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Create an owner user
    const ownerUser = await storage.createUser({
      email: "owner@example.com",
      username: "owner@example.com",
      password: "password123",
      role: "owner",
    });
    console.log("Created owner user:", ownerUser.email);

    // Create a manager user
    const managerUser = await storage.createUser({
      email: "manager@example.com",
      username: "manager@example.com",
      password: "password123",
      role: "manager",
    });
    console.log("Created manager user:", managerUser.email);

    // Create some venue types
    await storage.createVenueType("Wedding Venue");
    await storage.createVenueType("Corporate Event Space");
    await storage.createVenueType("Night Club");
    await storage.createVenueType("Restaurant");
    await storage.createVenueType("Hotel");
    console.log("Created venue types");

    // Create some personnel types
    await storage.createPersonnelType("DJ");
    await storage.createPersonnelType("KJ (Karaoke Jockey)");
    await storage.createPersonnelType("MC (Master of Ceremonies)");
    await storage.createPersonnelType("Lighting Tech");
    await storage.createPersonnelType("Sound Tech");
    console.log("Created personnel types");

    // Create some gig types
    await storage.createGigType("Wedding");
    await storage.createGigType("Corporate Event");
    await storage.createGigType("Birthday Party");
    await storage.createGigType("Karaoke Night");
    await storage.createGigType("Club Night");
    console.log("Created gig types");

    // Create some contact roles
    await storage.createContactRole("Venue Manager");
    await storage.createContactRole("Event Coordinator");
    await storage.createContactRole("Billing Contact");
    await storage.createContactRole("Technical Contact");
    console.log("Created contact roles");

    // Create some payment methods
    await storage.createPaymentMethod("Cash");
    await storage.createPaymentMethod("Check");
    await storage.createPaymentMethod("Credit Card");
    await storage.createPaymentMethod("Bank Transfer");
    await storage.createPaymentMethod("PayPal");
    await storage.createPaymentMethod("Venmo");
    console.log("Created payment methods");

    // Create some document types
    await storage.createDocumentType("Contract");
    await storage.createDocumentType("Invoice");
    await storage.createDocumentType("W-9 Form");
    await storage.createDocumentType("Insurance Certificate");
    await storage.createDocumentType("Venue Agreement");
    console.log("Created document types");

    console.log("\n✅ Database seeded successfully!");
    console.log("\nYou can now log in with:");
    console.log("  Owner: owner@example.com / password123");
    console.log("  Manager: manager@example.com / password123");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
  
  process.exit(0);
}

seedDatabase();