require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/user");
const Order = require("./models/order");
const BalanceTransaction = require("./models/balanceTransaction");

async function seedDemoAccounts() {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("❌ MONGO_URI not defined in .env");
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for seeding demo accounts...");

        const hashedPassword = await bcrypt.hash("demo1234", 10);

        // 1. Create / Upsert Demo Executive
        let demoExec = await User.findOne({ teamCode: "DEMO_EXEC", role: "executive" });
        if (!demoExec) {
            demoExec = await User.create({
                name: "Alex Rivera (Demo Executive)",
                teamCode: "DEMO_EXEC",
                role: "executive",
                password: hashedPassword,
            });
            console.log("Created Demo Executive (teamCode: DEMO_EXEC)");
        } else {
            demoExec.name = "Alex Rivera (Demo Executive)";
            demoExec.password = hashedPassword;
            await demoExec.save();
            console.log("Refreshed Demo Executive password and profile");
        }

        // 2. Create / Upsert Demo Mediator
        let demoMed = await User.findOne({ mediatorCode: "DEMO_MED", role: "mediator" });
        if (!demoMed) {
            demoMed = await User.create({
                name: "Sarah Chen (Demo Mediator)",
                mediatorCode: "DEMO_MED",
                teamCode: "DEMO_EXEC",
                role: "mediator",
                password: hashedPassword,
            });
            console.log("Created Demo Mediator (mediatorCode: DEMO_MED)");
        } else {
            demoMed.name = "Sarah Chen (Demo Mediator)";
            demoMed.teamCode = "DEMO_EXEC";
            demoMed.password = hashedPassword;
            await demoMed.save();
            console.log("Refreshed Demo Mediator password and profile");
        }

        // 3. Create / Upsert Demo Brand
        let demoBrand = await User.findOne({ brand: "DEMO_BRAND", role: "brand" });
        if (!demoBrand) {
            demoBrand = await User.create({
                name: "Aura Audio Global",
                brand: "DEMO_BRAND",
                role: "brand",
                password: hashedPassword,
            });
            console.log("Created Demo Brand (brand: DEMO_BRAND)");
        } else {
            demoBrand.name = "Aura Audio Global";
            demoBrand.password = hashedPassword;
            await demoBrand.save();
            console.log("Refreshed Demo Brand password and profile");
        }

        // 4. Seed Demo Orders if not already present
        const existingDemoOrder = await Order.findOne({ brand: "DEMO_BRAND" });
        if (!existingDemoOrder) {
            console.log("Seeding realistic demo orders for DEMO_BRAND...");

            // Order 1: Sony WH-1000XM5 (Multi-unit pipeline)
            const order1 = new Order({
                createdBy: demoExec._id,
                brandUserId: demoBrand._id,
                executiveName: demoExec.name,
                teamCode: demoExec.teamCode,
                brand: "DEMO_BRAND",
                productName: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
                productLink: "https://amazon.com/dp/B09XS7JWHH",
                price: "349.99",
                quantity: 5,
                orderPlatform: "Amazon",
                orderUnits: [
                    {
                        status: "unassigned",
                        mediatorId: null,
                    },
                    {
                        status: "pending_payment",
                        mediatorId: demoMed._id,
                        assignedAt: new Date(),
                    },
                    {
                        status: "assigned",
                        mediatorId: demoMed._id,
                        paymentScreenshot: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600",
                        paymentMessage: "Advance payment of $349.99 sent via UPI/Wire.",
                        paymentSentAt: new Date(),
                        assignedAt: new Date(),
                    },
                    {
                        status: "in_progress",
                        mediatorId: demoMed._id,
                        paymentScreenshot: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600",
                        paymentMessage: "Advance payment verified.",
                        assignedAt: new Date(),
                    },
                    {
                        status: "completed",
                        mediatorId: demoMed._id,
                        orderId: "ORD-SONY-77821",
                        reviewerName: "David Miller",
                        address: "742 Evergreen Terrace, Springfield",
                        orderReceivedOn: new Date(),
                        orderedScreenshot: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
                        postDeliveryDetails: {
                            success: true,
                            productReviewScreenshot: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600",
                            invoiceScreenshot: "https://images.unsplash.com/photo-1554415707-9e44667664d8?w=600",
                            sellerFeedbackScreenShot: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600",
                        },
                        completedAt: new Date(),
                    },
                ],
            });
            order1.recalculateSummary();
            await order1.save();

            // Order 2: Keychron Q1 Pro
            const order2 = new Order({
                createdBy: demoExec._id,
                brandUserId: demoBrand._id,
                executiveName: demoExec.name,
                teamCode: demoExec.teamCode,
                brand: "DEMO_BRAND",
                productName: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
                productLink: "https://keychron.com/products/keychron-q1-pro",
                price: "199.00",
                quantity: 3,
                orderPlatform: "Flipkart",
                orderUnits: [
                    {
                        status: "pending_refund",
                        mediatorId: demoMed._id,
                        orderId: "ORD-KEY-99312",
                        reviewerName: "Elena Rostova",
                        address: "124 Baker Street, London",
                        orderedScreenshot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                        mediatorPaymentScreenshot: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600",
                        mediatorMessage: "Order placed. Awaiting final refund processing.",
                    },
                    {
                        status: "completed",
                        mediatorId: demoMed._id,
                        orderId: "ORD-KEY-99313",
                        reviewerName: "Marcus Aurelius",
                        address: "88 Market St, San Francisco",
                        orderedScreenshot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                        postDeliveryDetails: {
                            success: true,
                            productReviewScreenshot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                            invoiceScreenshot: "https://images.unsplash.com/photo-1554415707-9e44667664d8?w=600",
                            sellerFeedbackScreenShot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                        },
                        completedAt: new Date(),
                    },
                    {
                        status: "completed",
                        mediatorId: demoMed._id,
                        orderId: "ORD-KEY-99314",
                        reviewerName: "Chloe Vance",
                        address: "500 Madison Ave, New York",
                        orderedScreenshot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                        postDeliveryDetails: {
                            success: true,
                            productReviewScreenshot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                            invoiceScreenshot: "https://images.unsplash.com/photo-1554415707-9e44667664d8?w=600",
                            sellerFeedbackScreenShot: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
                        },
                        completedAt: new Date(),
                    },
                ],
            });
            order2.recalculateSummary();
            await order2.save();

            console.log("Seeded 2 realistic multi-unit demo orders");
        } else {
            console.log("Demo orders for DEMO_BRAND already exist.");
        }

        // 5. Seed a sample balance settlement transaction
        const existingTx = await BalanceTransaction.findOne({
            $or: [
                { sender: demoExec._id, receiver: demoMed._id },
                { sender: demoMed._id, receiver: demoExec._id }
            ]
        });

        if (!existingTx) {
            await BalanceTransaction.create({
                sender: demoExec._id,
                senderRole: "executive",
                receiver: demoMed._id,
                receiverRole: "mediator",
                teamCode: demoExec.teamCode,
                direction: "executive_to_mediator",
                amount: 50,
                reason: "Price Increased (Price hike adjustment compensation)",
                status: "verified",
                verifiedAt: new Date(),
                paymentScreenshot: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600",
                message: "Price increased by $50 during Amazon flash sale end. Balance compensated.",
            });
            console.log("Seeded sample verified balance settlement transaction");
        }

        console.log("\n==========================================");
        console.log("DEMO ACCOUNTS READY TO USE:");
        console.log("1. EXECUTIVE ROLE:");
        console.log("   Name: Alex Rivera");
        console.log("   Team Code: DEMO_EXEC");
        console.log("   Password: demo1234");
        console.log("2. MEDIATOR ROLE:");
        console.log("   Name: Sarah Chen");
        console.log("   Mediator Code: DEMO_MED");
        console.log("   Password: demo1234");
        console.log("3. BRAND ROLE:");
        console.log("   Brand / Company Name: DEMO_BRAND");
        console.log("   Representative Name: Aura Audio Global");
        console.log("   Password: demo1234");
        console.log("==========================================\n");

        await mongoose.disconnect();
        console.log("MongoDB disconnected cleanly.");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding demo accounts:", err);
        process.exit(1);
    }
}

seedDemoAccounts();
