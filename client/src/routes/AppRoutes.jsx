import { Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import AppLayout from "../component/layout/AppLayout";

import Dashboard from "../pages/mediator/Dashboard";
import OrderSubmission from "../pages/mediator/OrderSubmission";
import RefundSubmission from "../pages/mediator/RefundSubmission";
import DisplayOrderDetails from "../pages/mediator/DisplayOrderDetails";
import SignUP from "../pages/mediator/SignUp";
import Login from "../pages/mediator/Login";
import MediatorDashboard from "../pages/mediator/MediatorDashboard";
import MediatorPendingOrders from "../pages/mediator/MediatorPendingOrders";
import MediatorRefundPendingOrders from "../pages/mediator/MediatorRefundPendingOrders";
import MediatorCompletedOrders from "../pages/mediator/MediatorCompletedOrders";
import MediatorEarnings from "../pages/mediator/MediatorEarnings";
import MediatorPendingPayment from "../pages/mediator/MediatorPendingPayment";
import MediatorPendingVerification from "../pages/mediator/MediatorPendingVerification";
import MediatorBalance from "../pages/mediator/MediatorBalance";
import MediatorDetailedOrdersBreakdown from "../pages/mediator/MediatorDetailedOrdersBreakdown";
import NewOrders from "../pages/mediator/NewOrders";

import LandingPage from "../pages/LandingPage";
import RoleSelection from "../pages/RoleSelection";
import ExecutiveLogin from "../pages/executive/ExecutiveLogin";
import ExecutiveSignup from "../pages/executive/ExecutiveSignup";
import ExecutiveDashboard from "../pages/executive/ExecutiveDashboard";
import AddNewOrder from "../pages/executive/AddNewOrder";
import PendingOrders from "../pages/executive/PendingOrders";
import PendingPaymentOrders from "../pages/executive/PendingPaymentOrders";
import MediatorSentOrders from "../pages/executive/MediatorSentOrders";
import AssignedOrders from "../pages/executive/AssignedOrders";
import In_progressOrders from "../pages/executive/In_progressOrders";
import Pending_refundOrders from "../pages/executive/Pending_refundOrders";
import ExecutiveVerifyOrders from "../pages/executive/ExecutiveVerifyOrders";
import CompletedOrders from "../pages/executive/CompletedOrders";
import AllMediator from "../pages/executive/AllMediators";
import ExecutiveBalance from "../pages/executive/ExecutiveBalance";

import BrandLogin from "../pages/brand/BrandLogin";
import BrandSignup from "../pages/brand/BrandSignup";
import BrandDashboard from "../pages/brand/BrandDashboard";

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
            <Route path="/mediator-earnings" element={<ProtectedLayout><MediatorEarnings /></ProtectedLayout>} />
            <Route path="/mediator-pending-payment" element={<ProtectedLayout><MediatorPendingPayment /></ProtectedLayout>} />
            <Route path="/mediator-balance" element={<ProtectedLayout><MediatorBalance /></ProtectedLayout>} />
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
            <Route path="/executive-completed-order" element={<ProtectedLayout><CompletedOrders /></ProtectedLayout>} />
            <Route path="/executive-balance" element={<ProtectedLayout><ExecutiveBalance /></ProtectedLayout>} />
            <Route path="/executive-mediators" element={<ProtectedLayout><AllMediator /></ProtectedLayout>} />

            {/* Brand Protected Routes */}
            <Route path="/dashboard-brand" element={<ProtectedLayout><BrandDashboard /></ProtectedLayout>} />
        </Routes>
    );
}