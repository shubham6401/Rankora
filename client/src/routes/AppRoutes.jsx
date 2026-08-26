import { Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
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



import RoleSelection from "../pages/RoleSelection";
import ExecutiveLogin from "../pages/executive/ExecutiveLogin";
import ExecutiveSignup from "../pages/executive/ExecutiveSignup";
import ExecutiveDashboard from "../pages/executive/ExecutiveDashboard";
import AddNewOrder from "../pages/executive/AddNewOrder";
import PendingOrders from "../pages/executive/PendingOrders";
import AssignedOrders from "../pages/executive/AssignedOrders";
import NewOrders from "../pages/mediator/NewOrders";
import In_progressOrders from "../pages/executive/In_progressOrders";
import Pending_refundOrders from "../pages/executive/pending_refundOrders";
import CompletedOrders from "../pages/executive/CompletedOrders";
import AllMediator from "../pages/executive/AllMediators";



import BrandLogin from "../pages/brand/BrandLogin";
import BrandSignup from "../pages/brand/BrandSignup";
import BrandDashboard from "../pages/brand/BrandDashboard";




export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/dashboard" element={
                <ProtectedRoutes>
                    <Dashboard />
                </ProtectedRoutes>

            } />
            <Route path="/mediator-order-submission/:id" element={
                <ProtectedRoutes>
                    <OrderSubmission />
                </ProtectedRoutes>

            } />
            <Route path="/mediator-refund-submission/:id" element={
                <ProtectedRoutes>
                    <RefundSubmission />
                </ProtectedRoutes>

            } />
            <Route path="/order/:id" element={
                <ProtectedRoutes>
                    <DisplayOrderDetails />
                </ProtectedRoutes>

            } />
            <Route path="/panel-mediator" element={
                <ProtectedRoutes>
                    <MediatorDashboard />
                </ProtectedRoutes>

            } />
            <Route path="/login-mediator" element={<Login />} />
            <Route path="/signup-mediator" element={<SignUP />} />
            <Route path="/mediator-neworders" element={
                <ProtectedRoutes>
                    <NewOrders />
                </ProtectedRoutes>

            } />

            <Route path="/mediator-pending-orders" element={
                <ProtectedRoutes>
                    <MediatorPendingOrders />
                </ProtectedRoutes>

            } />

             <Route path="/mediator-refund_pending-orders" element={
                <ProtectedRoutes>
                    <MediatorRefundPendingOrders />
                </ProtectedRoutes>

            } />

             <Route path="/mediator-completed-orders" element={
                <ProtectedRoutes>
                    <MediatorCompletedOrders />
                </ProtectedRoutes>

            } />




            {/* executive */}
            <Route path="/login-executive" element={<ExecutiveLogin />} />
            <Route path="/signup-executive" element={<ExecutiveSignup />} />
            <Route path="/dashboard-executive" element={

                <ProtectedRoutes>
                    <ExecutiveDashboard />

                </ProtectedRoutes>
            } />

            <Route path="/executive-add-order" element={

                <ProtectedRoutes>
                    <AddNewOrder />

                </ProtectedRoutes>
            } />

            <Route path="/executive-pending-order" element={

                <ProtectedRoutes>
                    <PendingOrders />

                </ProtectedRoutes>
            } />

            <Route path="/executive-assigned-order" element={

                <ProtectedRoutes>
                    <AssignedOrders />

                </ProtectedRoutes>
            } />

            <Route path="/executive-in_progress-order" element={

                <ProtectedRoutes>
                    <In_progressOrders />

                </ProtectedRoutes>
            } />

            <Route path="/executive-pending_refund-order" element={

                <ProtectedRoutes>
                    <Pending_refundOrders />

                </ProtectedRoutes>
            } />

             <Route path="/executive-completed-order" element={

                <ProtectedRoutes>
                    <CompletedOrders />

                </ProtectedRoutes>
            } />

            <Route path="/executive-mediators" element={

                <ProtectedRoutes>
                    <AllMediator />

                </ProtectedRoutes>
            } />

            {/* brand */}
            <Route path="/login-brand" element={<BrandLogin />} />
            <Route path="/signup-brand" element={<BrandSignup />} />
            <Route path="/dashboard-brand" element={

                <ProtectedRoutes>
                    <BrandDashboard />

                </ProtectedRoutes>
            } />


            <Route path="/role-selection" element={<RoleSelection />} />


        </Routes>
    )
}  