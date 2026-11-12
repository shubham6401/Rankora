import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import AppLayout from "../component/layout/AppLayout";

// Landing & General Public Pages
const LandingPage = lazy(() => import("../pages/LandingPage"));
const RoleSelection = lazy(() => import("../pages/RoleSelection"));

// Mediator Pages
const Dashboard = lazy(() => import("../pages/mediator/Dashboard"));
const OrderSubmission = lazy(() => import("../pages/mediator/OrderSubmission"));
const RefundSubmission = lazy(() => import("../pages/mediator/RefundSubmission"));
const DisplayOrderDetails = lazy(() => import("../pages/mediator/DisplayOrderDetails"));
const SignUP = lazy(() => import("../pages/mediator/SignUp"));
const Login = lazy(() => import("../pages/mediator/Login"));
const MediatorDashboard = lazy(() => import("../pages/mediator/MediatorDashboard"));
const MediatorPendingOrders = lazy(() => import("../pages/mediator/MediatorPendingOrders"));
const MediatorRefundPendingOrders = lazy(() => import("../pages/mediator/MediatorRefundPendingOrders"));
const MediatorCompletedOrders = lazy(() => import("../pages/mediator/MediatorCompletedOrders"));
const MediatorSettledOrders = lazy(() => import("../pages/mediator/MediatorSettledOrders"));
const MediatorEarnings = lazy(() => import("../pages/mediator/MediatorEarnings"));
const MediatorPendingPayment = lazy(() => import("../pages/mediator/MediatorPendingPayment"));
const MediatorPendingVerification = lazy(() => import("../pages/mediator/MediatorPendingVerification"));
const MediatorBalance = lazy(() => import("../pages/mediator/MediatorBalance"));
const MediatorDetailedOrdersBreakdown = lazy(() => import("../pages/mediator/MediatorDetailedOrdersBreakdown"));
const NewOrders = lazy(() => import("../pages/mediator/NewOrders"));
const MediatorPlatformIds = lazy(() => import("../pages/mediator/MediatorPlatformIds"));
const MediatorOrderTracker = lazy(() => import("../pages/mediator/MediatorOrderTracker"));

// Executive Pages
const ExecutiveLogin = lazy(() => import("../pages/executive/ExecutiveLogin"));
const ExecutiveSignup = lazy(() => import("../pages/executive/ExecutiveSignup"));
const ExecutiveDashboard = lazy(() => import("../pages/executive/ExecutiveDashboard"));
const AddNewOrder = lazy(() => import("../pages/executive/AddNewOrder"));
const PendingOrders = lazy(() => import("../pages/executive/PendingOrders"));
const PendingPaymentOrders = lazy(() => import("../pages/executive/PendingPaymentOrders"));
const MediatorSentOrders = lazy(() => import("../pages/executive/MediatorSentOrders"));
const AssignedOrders = lazy(() => import("../pages/executive/AssignedOrders"));
const In_progressOrders = lazy(() => import("../pages/executive/In_progressOrders"));
const Pending_refundOrders = lazy(() => import("../pages/executive/Pending_refundOrders"));
const ExecutiveVerifyOrders = lazy(() => import("../pages/executive/ExecutiveVerifyOrders"));
const ExecutiveInspectOrder = lazy(() => import("../pages/executive/ExecutiveInspectOrder"));
const CompletedOrders = lazy(() => import("../pages/executive/CompletedOrders"));
const SettledOrders = lazy(() => import("../pages/executive/SettledOrders"));
const AllMediator = lazy(() => import("../pages/executive/AllMediators"));
const ExecutiveBalance = lazy(() => import("../pages/executive/ExecutiveBalance"));
const ExecutiveMediatorEarnings = lazy(() => import("../pages/executive/ExecutiveMediatorEarnings"));
const ExecutiveBrands = lazy(() => import("../pages/executive/ExecutiveBrands"));
const ExecutiveBrandDetails = lazy(() => import("../pages/executive/ExecutiveBrandDetails"));
const ExecutiveAnalytics = lazy(() => import("../pages/executive/ExecutiveAnalytics"));
const ExecutiveAddresses = lazy(() => import("../pages/executive/ExecutiveAddresses"));

// Brand Pages
const BrandLogin = lazy(() => import("../pages/brand/BrandLogin"));
const BrandSignup = lazy(() => import("../pages/brand/BrandSignup"));
const BrandDashboard = lazy(() => import("../pages/brand/BrandDashboard"));

// Admin Pages
const AdminLogin = lazy(() => import("../pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));

function PageLoader() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
                color: "#6366f1",
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
        >
            <div
                style={{
                    width: "36px",
                    height: "36px",
                    border: "3px solid #e0e7ff",
                    borderTopColor: "#6366f1",
                    borderRadius: "50%",
                    animation: "pageSpin 0.7s linear infinite",
                }}
            />
            <style>{`@keyframes pageSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <span
                style={{
                    marginTop: "14px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#64748b",
                    letterSpacing: "0.02em",
                }}
            >
                Loading...
            </span>
        </div>
    );
}

function ProtectedLayout({ children }) {
    return (
        <ProtectedRoutes>
            <AppLayout>
                {children}
            </AppLayout>
        </ProtectedRoutes>
    );
}

export default function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/role-selection" element={<RoleSelection />} />

                {/* Public Auth Routes */}
                <Route path="/login-mediator" element={<Login />} />
                <Route path="/signup-mediator" element={<SignUP />} />
                <Route path="/login-executive" element={<ExecutiveLogin />} />
                <Route path="/signup-executive" element={<ExecutiveSignup />} />
                <Route path="/login-brand" element={<BrandLogin />} />
                <Route path="/signup-brand" element={<BrandSignup />} />

                {/* Mediator Protected Routes */}
                <Route path="/dashboard" element={<ProtectedLayout><MediatorDashboard /></ProtectedLayout>} />
                <Route path="/panel-mediator" element={<ProtectedLayout><MediatorDashboard /></ProtectedLayout>} />
                <Route path="/mediator-dashboard" element={<ProtectedLayout><MediatorDashboard /></ProtectedLayout>} />
                <Route path="/mediator-neworders" element={<ProtectedLayout><NewOrders /></ProtectedLayout>} />
                <Route path="/mediator-new-orders" element={<ProtectedLayout><NewOrders /></ProtectedLayout>} />
                <Route path="/mediator-pending-orders" element={<ProtectedLayout><MediatorPendingOrders /></ProtectedLayout>} />
                <Route path="/mediator-refund_pending-orders" element={<ProtectedLayout><MediatorRefundPendingOrders /></ProtectedLayout>} />
                <Route path="/mediator-refund-pending-orders" element={<ProtectedLayout><MediatorRefundPendingOrders /></ProtectedLayout>} />
                <Route path="/mediator-pending-verification" element={<ProtectedLayout><MediatorPendingVerification /></ProtectedLayout>} />
                <Route path="/mediator-completed-orders" element={<ProtectedLayout><MediatorCompletedOrders /></ProtectedLayout>} />
                <Route path="/mediator-settled-orders" element={<ProtectedLayout><MediatorSettledOrders /></ProtectedLayout>} />
                <Route path="/mediator-earnings" element={<ProtectedLayout><MediatorEarnings /></ProtectedLayout>} />
                <Route path="/mediator-pending-payment" element={<ProtectedLayout><MediatorPendingPayment /></ProtectedLayout>} />
                <Route path="/mediator-pending_payment-orders" element={<ProtectedLayout><MediatorPendingPayment /></ProtectedLayout>} />
                <Route path="/mediator-pending-payment-orders" element={<ProtectedLayout><MediatorPendingPayment /></ProtectedLayout>} />
                <Route path="/mediator-balance" element={<ProtectedLayout><MediatorBalance /></ProtectedLayout>} />
                <Route path="/mediator-ids" element={<ProtectedLayout><MediatorPlatformIds /></ProtectedLayout>} />
                <Route path="/mediator-platform-ids" element={<ProtectedLayout><MediatorPlatformIds /></ProtectedLayout>} />
                <Route path="/mediator-tracker" element={<ProtectedLayout><MediatorOrderTracker /></ProtectedLayout>} />
                <Route path="/mediator-order-tracker" element={<ProtectedLayout><MediatorOrderTracker /></ProtectedLayout>} />
                <Route path="/mediator-assigned-orders-breakdown" element={<ProtectedLayout><MediatorDetailedOrdersBreakdown /></ProtectedLayout>} />
                <Route path="/mediator-detailed-orders" element={<ProtectedLayout><MediatorDetailedOrdersBreakdown /></ProtectedLayout>} />
                <Route path="/mediator-order-submission/:id" element={<ProtectedLayout><OrderSubmission /></ProtectedLayout>} />
                <Route path="/order-submission/:id" element={<ProtectedLayout><OrderSubmission /></ProtectedLayout>} />
                <Route path="/mediator-refund-submission/:id" element={<ProtectedLayout><RefundSubmission /></ProtectedLayout>} />
                <Route path="/refund-submission/:id" element={<ProtectedLayout><RefundSubmission /></ProtectedLayout>} />
                <Route path="/order/:id" element={<ProtectedLayout><DisplayOrderDetails /></ProtectedLayout>} />
                <Route path="/executive-order/:id" element={<ProtectedLayout><DisplayOrderDetails /></ProtectedLayout>} />

                {/* Executive Protected Routes */}
                <Route path="/dashboard-executive" element={<ProtectedLayout><ExecutiveDashboard /></ProtectedLayout>} />
                <Route path="/executive-dashboard" element={<ProtectedLayout><ExecutiveDashboard /></ProtectedLayout>} />
                <Route path="/executive-add-order" element={<ProtectedLayout><AddNewOrder /></ProtectedLayout>} />
                <Route path="/executive-pending-order" element={<ProtectedLayout><PendingOrders /></ProtectedLayout>} />
                <Route path="/executive-pending-payment" element={<ProtectedLayout><PendingPaymentOrders /></ProtectedLayout>} />
                <Route path="/executive-mediator-sent-payment" element={<ProtectedLayout><MediatorSentOrders /></ProtectedLayout>} />
                <Route path="/executive-assigned-order" element={<ProtectedLayout><AssignedOrders /></ProtectedLayout>} />
                <Route path="/executive-in_progress-order" element={<ProtectedLayout><In_progressOrders /></ProtectedLayout>} />
                <Route path="/executive-pending_refund-order" element={<ProtectedLayout><Pending_refundOrders /></ProtectedLayout>} />
                <Route path="/executive-verify-orders" element={<ProtectedLayout><ExecutiveVerifyOrders /></ProtectedLayout>} />
                <Route path="/executive-verify-order/:id" element={<ProtectedLayout><ExecutiveInspectOrder /></ProtectedLayout>} />
                <Route path="/executive-completed-order" element={<ProtectedLayout><CompletedOrders /></ProtectedLayout>} />
                <Route path="/executive-settled-orders" element={<ProtectedLayout><SettledOrders /></ProtectedLayout>} />
                <Route path="/executive-balance" element={<ProtectedLayout><ExecutiveBalance /></ProtectedLayout>} />
                <Route path="/executive-mediators" element={<ProtectedLayout><AllMediator /></ProtectedLayout>} />
                <Route path="/executive-brands" element={<ProtectedLayout><ExecutiveBrands /></ProtectedLayout>} />
                <Route path="/executive-brands/:brandUserId" element={<ProtectedLayout><ExecutiveBrandDetails /></ProtectedLayout>} />
                <Route path="/executive-analytics" element={<ProtectedLayout><ExecutiveAnalytics /></ProtectedLayout>} />
                <Route path="/executive-addresses" element={<ProtectedLayout><ExecutiveAddresses /></ProtectedLayout>} />
                <Route path="/executive-mediator-earnings" element={<ProtectedLayout><ExecutiveMediatorEarnings /></ProtectedLayout>} />
                <Route path="/executive-earnings" element={<ProtectedLayout><ExecutiveMediatorEarnings /></ProtectedLayout>} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<ProtectedLayout><AdminDashboard /></ProtectedLayout>} />
                <Route path="/admin-dashboard" element={<ProtectedLayout><AdminDashboard /></ProtectedLayout>} />

                {/* Brand Protected Routes */}
                <Route path="/dashboard-brand" element={<ProtectedLayout><BrandDashboard /></ProtectedLayout>} />
                <Route path="/brand-dashboard" element={<ProtectedLayout><BrandDashboard /></ProtectedLayout>} />
            </Routes>
        </Suspense>
    );
}
