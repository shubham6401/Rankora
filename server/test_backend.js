const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Ensure test environment
process.env.NODE_ENV = "test";
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/user");
const Order = require("./models/order");

const PORT = 8001;
let server;
let baseUrl = `http://localhost:${PORT}/api`;

async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    const fetchOptions = {
        method: options.method || "GET",
        headers,
    };

    if (options.body) {
        if (typeof options.body === "string") {
            fetchOptions.body = options.body;
        } else {
            fetchOptions.body = JSON.stringify(options.body);
        }
    }

    const res = await fetch(url, fetchOptions);
    let data;
    try {
        data = await res.json();
    } catch {
        data = null;
    }
    return { status: res.status, data };
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        throw new Error(message);
    }
    console.log(`  ✅ ${message}`);
}

async function runTests() {
    console.log("🚀 Starting Backend End-to-End Test Suite...\n");

    await connectDB();
    server = app.listen(PORT);
    console.log(`Test server running on port ${PORT}\n`);

    const timestamp = Date.now();
    const testTeamCode = `TEAM_${timestamp}`;
    const testMediatorCode = `MED_${timestamp}`;
    const testBrandName = `BRAND_${timestamp}`;

    try {
        // 1. Health Check
        console.log("👉 Test 1: Health Check Endpoint");
        const health = await request("/health");
        assert(health.status === 200, "Health check returns 200");
        assert(health.data.success === true, "Health check reports success");

        // 2. Executive Signup & Login
        console.log("\n👉 Test 2: Executive Signup & Login");
        const execSignup = await request("/auth/signup/executive", {
            method: "POST",
            body: {
                name: "John Executive",
                password: "execPassword123",
                teamCode: testTeamCode,
            },
        });
        assert(execSignup.status === 201, "Executive signup returns 201");

        const execLogin = await request("/auth/login/executive", {
            method: "POST",
            body: {
                teamCode: testTeamCode,
                password: "execPassword123",
            },
        });
        assert(execLogin.status === 200, "Executive login returns 200");
        assert(!!execLogin.data.token, "Executive login returns JWT token");
        const execToken = execLogin.data.token;
        const execHeaders = { Authorization: `Bearer ${execToken}` };

        // Test wrong password rejection
        const wrongExecLogin = await request("/auth/login/executive", {
            method: "POST",
            body: {
                teamCode: testTeamCode,
                password: "WRONG_PASSWORD",
            },
        });
        assert(wrongExecLogin.status === 401, "Executive login rejects wrong password with 401");

        // 3. Brand Signup & Login
        console.log("\n👉 Test 3: Brand Signup & Login");
        const brandSignup = await request("/auth/signup/brand", {
            method: "POST",
            body: {
                name: "Nike Official",
                password: "brandPassword123",
                brand: testBrandName,
            },
        });
        assert(brandSignup.status === 201, "Brand signup returns 201");
        const brandUserId = brandSignup.data.user.id;

        const brandLogin = await request("/auth/login/brand", {
            method: "POST",
            body: {
                brand: testBrandName,
                password: "brandPassword123",
            },
        });
        assert(brandLogin.status === 200, "Brand login returns 200");
        const brandToken = brandLogin.data.token;
        const brandHeaders = { Authorization: `Bearer ${brandToken}` };

        // 4. Mediator Signup & Login
        console.log("\n👉 Test 4: Mediator Signup by Executive & Login");
        const medSignup = await request("/auth/signup/mediator", {
            method: "POST",
            headers: execHeaders,
            body: {
                name: "Alice Mediator",
                password: "medPassword123",
                mediatorCode: testMediatorCode,
                teamCode: testTeamCode,
            },
        });
        assert(medSignup.status === 201, "Mediator signup returns 201");
        const mediatorUserId = medSignup.data.user.id;

        const medLogin = await request("/auth/login/mediator", {
            method: "POST",
            body: {
                mediatorCode: testMediatorCode,
                password: "medPassword123",
            },
        });
        assert(medLogin.status === 200, "Mediator login returns 200");
        assert(!!medLogin.data.token, "Mediator login returns JWT token");
        const medToken = medLogin.data.token;
        const medHeaders = { Authorization: `Bearer ${medToken}` };

        // Test mediator wrong password
        const wrongMedLogin = await request("/auth/login/mediator", {
            method: "POST",
            body: {
                mediatorCode: testMediatorCode,
                password: "WRONG_PASS",
            },
        });
        assert(wrongMedLogin.status === 401, "Mediator login rejects wrong password with 401");

        // 5. Auth Middleware Protection & Non-Hanging Check
        console.log("\n👉 Test 5: Auth Middleware Protection (No Request Freezing)");
        const invalidAuth = await request("/executive/orders", {
            headers: { Authorization: "Bearer INVALID_TOKEN_HERE" },
        });
        assert(invalidAuth.status === 401, "Invalid token immediately rejected with 401");

        const noAuth = await request("/executive/orders");
        assert(noAuth.status === 401, "Missing token immediately rejected with 401");

        // 6. Executive Creating Master Order with Units
        console.log("\n👉 Test 6: Executive Creating Master Order");
        const createOrder = await request("/executive/order/add", {
            method: "POST",
            headers: execHeaders,
            body: {
                brandUserId: brandUserId,
                productName: "Air Max Running Shoes",
                productLink: "https://example.com/shoes",
                price: "4999",
                quantity: 4,
                orderPlatform: "Amazon",
            },
        });
        assert(createOrder.status === 201, "Order creation returns 201");
        assert(createOrder.data.order.orderUnits.length === 4, "Order has 4 initial orderUnits");
        assert(createOrder.data.order.summary.unassigned === 4, "Summary unassigned count is 4");
        const orderId = createOrder.data.order._id;

        // 7. Executive Fetching Pending (Unassigned) Orders
        console.log("\n👉 Test 7: Executive Fetching Pending Orders");
        const execPending = await request("/executive/orders/pending", {
            headers: execHeaders,
        });
        assert(execPending.status === 200, "Executive pending orders returns 200");
        assert(execPending.data.orders.some((o) => o._id === orderId), "Created order appears in pending orders");

        // 8. Executive Assigning 3 Units to Mediator -> Moves to pending_payment
        console.log("\n👉 Test 8: Executive Assigning Units to Mediator (Pending Payment)");
        const assignRes = await request(`/executive/order/assign/${orderId}`, {
            method: "POST",
            headers: execHeaders,
            body: {
                mediatorId: mediatorUserId,
                quantity: 3,
            },
        });
        assert(assignRes.status === 200, "Order assignment returns 200");
        assert(assignRes.data.order.summary.unassigned === 1, "Unassigned count updated to 1");
        assert(assignRes.data.order.summary.assigned === 3, "Assigned count updated to 3");

        // 9. Executive Fetching Assigned Orders
        console.log("\n👉 Test 9: Executive Fetching Assigned Orders");
        const execAssignedCheck = await request("/executive/orders/assigned", {
            headers: execHeaders,
        });
        assert(execAssignedCheck.status === 200, "Assigned orders returns 200");
        assert(execAssignedCheck.data.orders.some((o) => o._id === orderId), "Assigned order appears in assigned list");

        // 10. Executive Altering / Unassigning 1 Wrongly Assigned Unit Back to Pending
        console.log("\n👉 Test 10: Executive Reverting Wrongly Assigned Unit Back to Pending");
        const unassignRes = await request("/executive/order/unassign", {
            method: "POST",
            headers: execHeaders,
            body: {
                orderId: orderId,
                mediatorId: mediatorUserId,
                quantity: 1,
            },
        });
        assert(unassignRes.status === 200, "Unassign returns 200");
        assert(unassignRes.data.order.summary.unassigned === 2, "Unassigned count increased back to 2");
        assert(unassignRes.data.order.summary.assigned === 2, "Assigned count decreased to 2");

        // Reassign that unit back to mediator (now 3 units in pending_payment)
        await request(`/executive/order/assign/${orderId}`, {
            method: "POST",
            headers: execHeaders,
            body: {
                mediatorId: mediatorUserId,
                quantity: 1,
            },
        });

        // 11. Executive Uploading Payment Screenshot Proof & Note
        console.log("\n👉 Test 11: Executive Uploading Payment Screenshot & Note");
        const paymentRes = await request(`/executive/order/submit-payment/${mediatorUserId}`, {
            method: "POST",
            headers: execHeaders,
            body: {
                paymentScreenshot: "https://res.cloudinary.com/demo/image/upload/payment_receipt_sample.jpg",
                paymentMessage: "Paid advance for 3 units via UPI",
            },
        });
        assert(paymentRes.status === 200, "Payment proof submission returns 200");

        // Check Executive Assigned Orders
        const execAssigned = await request("/executive/orders/assigned", {
            headers: execHeaders,
        });
        assert(execAssigned.status === 200, "Executive assigned orders returns 200");
        assert(execAssigned.data.orders.some((o) => o._id === orderId), "Order now present in Executive Assigned Orders");

        // 12. Mediator Fetching New Orders (Includes Payment Proof SS & Note)
        console.log("\n👉 Test 12: Mediator Fetching New Orders with Payment SS & Note");
        const medNewOrders = await request("/mediator/new/orders", {
            headers: medHeaders,
        });
        assert(medNewOrders.status === 200, "Mediator new orders returns 200");
        const mediatorOrder = medNewOrders.data.orders.find((o) => o._id === orderId);
        assert(!!mediatorOrder, "Order appears in mediator's new orders");
        assert(mediatorOrder.orderUnits[0].paymentScreenshot !== null, "Payment screenshot is attached to order units");
        assert(mediatorOrder.orderUnits[0].paymentMessage === "Paid advance for 3 units via UPI", "Payment message attached");

        // 13. Mediator Accepting 2 Units -> Moves directly to in_progress
        console.log("\n👉 Test 13: Mediator Accepting 2 Units -> In Progress");
        const acceptRes = await request(`/mediator/order/accept/${orderId}`, {
            method: "POST",
            headers: medHeaders,
            body: { quantity: 2 },
        });
        assert(acceptRes.status === 200, "Order acceptance returns 200");
        assert(acceptRes.data.order.summary.inProgress === 2, "Summary inProgress updated to 2");
        assert(acceptRes.data.order.summary.assigned === 1, "Summary assigned updated to 1");

        // 14. Mediator Rejecting 1 Unit -> Moves to pending_payment
        console.log("\n👉 Test 14: Mediator Rejecting 1 Unit -> Moves to Pending Payment");
        const rejectRes = await request(`/mediator/order/reject/${orderId}`, {
            method: "POST",
            headers: medHeaders,
            body: { quantity: 1 },
        });
        assert(rejectRes.status === 200, "Order rejection returns 200");
        assert(rejectRes.data.order.summary.assigned === 0, "Summary assigned updated to 0");
        assert(rejectRes.data.order.summary.pendingPayment === 1, "Summary pendingPayment updated to 1");

        // 15. Mediator Viewing Pending Payment (Refunds) & Submitting Refund Proof
        console.log("\n👉 Test 15: Mediator Submitting Refund Proof & Message on Rejected Unit");
        const medPendingPayment = await request("/mediator/orders/pending_payment", {
            headers: medHeaders,
        });
        assert(medPendingPayment.status === 200, "Mediator pending payment orders returns 200");
        assert(medPendingPayment.data.orders.some((o) => o._id === orderId), "Rejected order appears in mediator pending payment");

        const submitRefundProof = await request(`/mediator/order/submit-payment/${orderId}`, {
            method: "POST",
            headers: medHeaders,
            body: {
                paymentScreenshot: "https://res.cloudinary.com/demo/image/upload/mediator_refund_ss.jpg",
                message: "Refunded ₹4999 back to your bank account for the 1 unit rejected",
            },
        });
        assert(submitRefundProof.status === 200, "Mediator refund proof submission returns 200");

        // 16. Executive Viewing Mediator Sent Orders & Accepting Refund
        console.log("\n👉 Test 16: Executive Verifying Mediator Refund & Accepting Unit Back to Pending");
        const execMediatorSent = await request("/executive/orders/mediator_sent", {
            headers: execHeaders,
        });
        assert(execMediatorSent.status === 200, "Executive mediator_sent orders returns 200");
        const sentOrder = execMediatorSent.data.orders.find((o) => o._id === orderId);
        assert(!!sentOrder, "Sent order present in executive mediator_sent list");
        assert(
            sentOrder.orderUnits[0].mediatorPaymentScreenshot === "https://res.cloudinary.com/demo/image/upload/mediator_refund_ss.jpg",
            "Mediator refund screenshot is present"
        );
        assert(
            sentOrder.orderUnits[0].mediatorMessage === "Refunded ₹4999 back to your bank account for the 1 unit rejected",
            "Mediator refund message is present"
        );

        // Executive Accepts Verified Refund -> Unit Returns to unassigned (Pending Orders)
        const execAcceptPaymentRes = await request(`/executive/order/accept-payment/${orderId}`, {
            method: "POST",
            headers: execHeaders,
            body: {
                mediatorId: mediatorUserId,
                quantity: 1,
            },
        });
        assert(execAcceptPaymentRes.status === 200, "Executive accepts payment returns 200");
        // Originally 1 unassigned unit remained, now 1 rejected unit is returned to unassigned -> total 2 unassigned!
        assert(execAcceptPaymentRes.data.order.summary.unassigned === 2, "Unit returned to unassigned (total 2 unassigned)");
        assert(execAcceptPaymentRes.data.order.summary.pendingPayment === 0, "Summary pendingPayment cleared to 0");

        // 17. Mediator Fetching In-Progress Orders
        console.log("\n👉 Test 17: Mediator Fetching In-Progress Orders");
        const medPending = await request("/mediator/orders/pending", {
            headers: medHeaders,
        });
        assert(medPending.status === 200, "Mediator pending orders returns 200");
        assert(medPending.data.orders.length > 0, "Mediator has in-progress orders returned");

        // 18. Mediator Submitting Order Placement Details -> Pending Refund
        console.log("\n👉 Test 18: Mediator Submitting Order Placement Details");
        const submitOrderRes = await request(`/mediator/order/submit/${orderId}`, {
            method: "POST",
            headers: medHeaders,
            body: {
                orderId: "AMZ-998877",
                expectedArrivalDate: new Date().toISOString(),
                address: "221B Baker Street",
                reviewerName: "John Reviewer",
                orderReceivedOn: new Date().toISOString(),
                season: "Fall 2026",
                orderedScreenshot: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            },
        });
        assert(submitOrderRes.status === 200, "Order submission returns 200");
        assert(submitOrderRes.data.order.summary.inProgress === 1, "inProgress count decreased to 1");
        assert(submitOrderRes.data.order.summary.pendingRefund === 1, "pendingRefund count increased to 1");

        // 19. Mediator Fetching Refund Pending Orders
        console.log("\n👉 Test 19: Mediator Fetching Refund Pending Orders");
        const refundPending = await request("/mediator/orders/refund_pending", {
            headers: medHeaders,
        });
        assert(refundPending.status === 200, "Refund pending orders returns 200");
        assert(refundPending.data.orders.some((o) => o._id === orderId), "Order appears in refund pending list");

        // 20. Mediator Submitting Refund Screenshots -> Pending Verification
        console.log("\n👉 Test 20: Mediator Submitting Refund Proof -> Pending Verification");
        const refundSubmitRes = await request(`/mediator/refund/submit/${orderId}`, {
            method: "POST",
            headers: medHeaders,
            body: {
                productReviewScreenshot: "https://res.cloudinary.com/demo/image/upload/review.jpg",
                invoiceScreenshot: "https://res.cloudinary.com/demo/image/upload/invoice.jpg",
                sellerFeedbackScreenShot: "https://res.cloudinary.com/demo/image/upload/feedback.jpg",
            },
        });
        assert(refundSubmitRes.status === 200, "Refund submission returns 200");
        assert(refundSubmitRes.data.order.summary.pendingRefund === 0, "pendingRefund count decreased to 0");
        assert(refundSubmitRes.data.order.summary.pendingVerification === 1, "pendingVerification count is 1");
        assert(refundSubmitRes.data.order.summary.completed === 0, "completed count remains 0 before verification");

        const targetUnitId = refundSubmitRes.data.order.orderUnits.find(
            (u) => u.status === "pending_verification"
        )?._id;
        assert(!!targetUnitId, "Found unit in pending_verification");

        // 20a. Mediator Fetching Pending Verification Orders
        console.log("\n👉 Test 20a: Mediator Fetching Pending Verification Orders");
        const medPendingVerify = await request("/mediator/orders/pending_verification", {
            headers: medHeaders,
        });
        assert(medPendingVerify.status === 200, "Mediator pending verification returns 200");
        assert(medPendingVerify.data.orders.some((o) => o._id === orderId), "Order appears in mediator pending verification list");

        // 20b. Executive Fetching Pending Verification Orders
        console.log("\n👉 Test 20b: Executive Fetching Pending Verification Orders");
        const execPendingVerify = await request("/executive/orders/pending_verification", {
            headers: execHeaders,
        });
        assert(execPendingVerify.status === 200, "Executive pending verification returns 200");
        assert(execPendingVerify.data.orders.some((o) => o._id === orderId), "Order appears in executive pending verification list");

        // 20c. Executive Requesting Revision -> Reverts to Pending Refund
        console.log("\n👉 Test 20c: Executive Requesting Revision (Revert to Pending Refund)");
        const revisionRes = await request("/executive/order/reject-unit-verification", {
            method: "POST",
            headers: execHeaders,
            body: {
                orderId,
                unitId: targetUnitId,
                reason: "Invoice screenshot is blurry, please re-upload clear proof",
            },
        });
        assert(revisionRes.status === 200, "Reject verification returns 200");
        assert(revisionRes.data.order.summary.pendingRefund === 1, "Unit reverted to pending_refund");
        assert(revisionRes.data.order.summary.pendingVerification === 0, "pendingVerification count decreased to 0");

        // 20d. Mediator Resubmitting Corrected Proofs
        console.log("\n👉 Test 20d: Mediator Resubmitting Corrected Proofs");
        const resubmitRes = await request(`/mediator/refund/submit/${orderId}`, {
            method: "POST",
            headers: medHeaders,
            body: {
                productReviewScreenshot: "https://res.cloudinary.com/demo/image/upload/review_clear.jpg",
                invoiceScreenshot: "https://res.cloudinary.com/demo/image/upload/invoice_clear.jpg",
                sellerFeedbackScreenShot: "https://res.cloudinary.com/demo/image/upload/feedback_clear.jpg",
            },
        });
        assert(resubmitRes.status === 200, "Resubmission returns 200");
        assert(resubmitRes.data.order.summary.pendingVerification === 1, "pendingVerification count is 1 again");

        // 20e. Executive Verifying Unit -> Moves to Completed
        console.log("\n👉 Test 20e: Executive Verifying Delivery Unit -> Completed");
        const verifyRes = await request("/executive/order/verify-unit", {
            method: "POST",
            headers: execHeaders,
            body: {
                orderId,
                unitId: targetUnitId,
            },
        });
        assert(verifyRes.status === 200, "Unit verification returns 200");
        assert(verifyRes.data.order.summary.completed === 1, "completed count increased to 1");
        assert(verifyRes.data.order.summary.pendingVerification === 0, "pendingVerification count decreased to 0");

        // 21. Mediator Completed Orders & Executive Completed Orders
        console.log("\n👉 Test 21: Fetching Completed Orders");
        const medCompleted = await request("/mediator/orders/completed", {
            headers: medHeaders,
        });
        assert(medCompleted.status === 200, "Mediator completed orders returns 200");
        assert(medCompleted.data.orders.some((o) => o._id === orderId), "Order present in mediator completed list");

        const execCompleted = await request("/executive/orders/completed", {
            headers: execHeaders,
        });
        assert(execCompleted.status === 200, "Executive completed orders returns 200");
        assert(execCompleted.data.orders.some((o) => o._id === orderId), "Order present in executive completed list");

        // 22. Brand Dashboard Orders
        console.log("\n👉 Test 22: Brand Orders Endpoint");
        const brandOrders = await request("/brand/order", {
            headers: brandHeaders,
        });
        assert(brandOrders.status === 200, "Brand orders returns 200");
        assert(brandOrders.data.orders.some((o) => o._id === orderId), "Order present in brand dashboard");

        // 23. Single Order and History
        console.log("\n👉 Test 23: Single Order and History Endpoints");
        const singleOrder = await request(`/order/${orderId}`, {
            headers: execHeaders,
        });
        assert(singleOrder.status === 200, "Single order fetch returns 200");
        assert(singleOrder.data.order.productName === "Air Max Running Shoes", "Single order returns correct data");

        const history = await request("/orders/history", {
            headers: execHeaders,
        });
        assert(history.status === 200, "Order history returns 200");
        assert(history.data.orders.length > 0, "Order history contains records");

        // 24. Executive Sending Balance to Mediator (Price Increased)
        console.log("\n👉 Test 24: Executive Sending Balance to Mediator (Price Increased)");
        const execSendBalance = await request("/balance/send", {
            method: "POST",
            headers: execHeaders,
            body: {
                receiverId: mediatorUserId,
                amount: 500,
                reason: "Price Increased (Reimbursement to Mediator)",
                message: "Paid via UPI Ref #EXEC98765",
                paymentScreenshot: "https://res.cloudinary.com/demo/image/upload/exec_balance_proof.jpg",
            },
        });
        assert(execSendBalance.status === 201, "Executive balance send returns 201");
        assert(execSendBalance.data.transaction.amount === 500, "Transaction amount is 500");
        assert(execSendBalance.data.transaction.direction === "executive_to_mediator", "Direction is executive_to_mediator");
        assert(execSendBalance.data.transaction.status === "pending", "Transaction status is pending");
        const execTxId = execSendBalance.data.transaction._id;

        // 25. Mediator Viewing Incoming Balance & Verifying
        console.log("\n👉 Test 25: Mediator Viewing Incoming Balance & Verifying");
        const medTxList = await request("/balance/my-transactions", {
            headers: medHeaders,
        });
        assert(medTxList.status === 200, "Mediator balance transactions returns 200");
        assert(medTxList.data.summary.pendingIncomingCount >= 1, "Mediator has at least 1 pending incoming balance");
        assert(medTxList.data.transactions.some((t) => t._id === execTxId), "Transaction present in mediator list");

        const medVerify = await request(`/balance/verify/${execTxId}`, {
            method: "POST",
            headers: medHeaders,
        });
        assert(medVerify.status === 200, "Mediator verifies balance returns 200");
        assert(medVerify.data.transaction.status === "verified", "Transaction status updated to verified");

        // 26. Mediator Sending Refund Balance to Executive (Price Decreased)
        console.log("\n👉 Test 26: Mediator Sending Refund Balance to Executive (Price Decreased)");
        const medSendBalance = await request("/balance/send", {
            method: "POST",
            headers: medHeaders,
            body: {
                amount: 250,
                reason: "Price Decreased (Refunding Leftover Money to Executive)",
                message: "Refunded via PhonePe UPI Ref #MED12345",
                paymentScreenshot: "https://res.cloudinary.com/demo/image/upload/med_refund_proof.jpg",
            },
        });
        assert(medSendBalance.status === 201, "Mediator balance refund returns 201");
        assert(medSendBalance.data.transaction.amount === 250, "Refund amount is 250");
        assert(medSendBalance.data.transaction.direction === "mediator_to_executive", "Direction is mediator_to_executive");
        assert(medSendBalance.data.transaction.status === "pending", "Refund status is pending");
        const medTxId = medSendBalance.data.transaction._id;

        // 27. Executive Viewing Incoming Refund & Verifying
        console.log("\n👉 Test 27: Executive Viewing Incoming Refund & Verifying");
        const execTxList = await request("/balance/my-transactions", {
            headers: execHeaders,
        });
        assert(execTxList.status === 200, "Executive balance transactions returns 200");
        assert(execTxList.data.summary.pendingIncomingCount >= 1, "Executive has at least 1 pending incoming refund");
        assert(execTxList.data.transactions.some((t) => t._id === medTxId), "Refund transaction present in executive list");

        const execVerify = await request(`/balance/verify/${medTxId}`, {
            method: "POST",
            headers: execHeaders,
        });
        assert(execVerify.status === 200, "Executive verifies refund returns 200");
        assert(execVerify.data.transaction.status === "verified", "Refund status updated to verified");

        // 28. Executive Fetching Team Mediators for Balance Settlement
        console.log("\n👉 Test 28: Executive Fetching Team Mediators for Balance Settlement");
        const teamMeds = await request("/balance/team-mediators", {
            headers: execHeaders,
        });
        assert(teamMeds.status === 200, "Team mediators returns 200");
        assert(teamMeds.data.mediators.some((m) => m._id === mediatorUserId), "Test mediator present in team mediators list");

        // 29. Mediator Order Summary & All Assigned Orders
        console.log("\n👉 Test 29: Mediator Fetching Order Summary & Quantity Breakdown");
        const medSummaryRes = await request("/mediator/summary", {
            headers: medHeaders,
        });
        assert(medSummaryRes.status === 200, "Mediator summary returns 200");
        assert(medSummaryRes.data.success === true, "Mediator summary success is true");
        assert(medSummaryRes.data.summary.totalUnits >= 1, "Mediator summary totalUnits is accurate");
        assert(medSummaryRes.data.summary.completedUnits >= 1, "Mediator summary completedUnits is accurate");
        assert(typeof medSummaryRes.data.summary.totalValue === "number", "Mediator summary totalValue is a number");

        console.log("\n🎉 ALL 29 TEST SUITES PASSED PERFECTLY! BACKEND IS 100% WORKING!");
    } catch (err) {
        console.error("\n❌ Test failed with error:", err);
        process.exitCode = 1;
    } finally {
        if (server) {
            server.close();
        }
        await mongoose.disconnect();
        console.log("\nServer & Database connections closed.");
    }
}

runTests();
