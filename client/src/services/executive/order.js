import api from "../api";


export const fetchAllExecutiveOrders=()=>{ 
    return api.post("/executive/orders");
}

export const fetchAllExecutivePendingOrders=()=>{
    return api.get("/executive/orders/pending");
}

export const fetchAllExecutivePendingPaymentOrders=()=>{
    return api.get("/executive/orders/pending_payment");
}

export const fetchAllExecutiveAssignedOrders=()=>{
    return api.get("/executive/orders/assigned");
}

export const fetchAllExecutiveIn_ProgressOrders=()=>{
    return api.get("/executive/orders/in_progress");
}

export const fetchAllExecutivePending_RefundOrders=()=>{
    return api.get("/executive/orders/pending_refund");
}

export const fetchAllExecutivePendingVerificationOrders=()=>{
    return api.get("/executive/orders/pending_verification");
}

export const fetchAllExecutiveCompletedOrders=()=>{
    return api.get("/executive/orders/completed");
}

export const verifyExecutiveOrderUnit=(data)=>{
    return api.post("/executive/order/verify-unit", data);
}

export const rejectExecutiveOrderUnitVerification=(data)=>{
    return api.post("/executive/order/reject-unit-verification", data);
}

export const addExecutiveOrder=(data)=>{
    return api.post("/executive/order/add",data);
}

export const fetchAllMediators=()=>{
    return api.get("/executive/mediators");
}

export const AssignOrderToMediator=(id,data)=>{
    return api.post(`/executive/order/assign/${id}`,data);
}

export const unassignExecutiveOrderUnit=(data)=>{
    return api.post("/executive/order/unassign", data);
}

export const submitExecutivePaymentProof=(mediatorId, formData)=>{
    return api.post(`/executive/order/submit-payment/${mediatorId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}

export const fetchExecutiveMediatorSentOrders = () => {
    return api.get("/executive/orders/mediator_sent");
};

export const acceptExecutiveMediatorPayment = (orderId, data) => {
    return api.post(`/executive/order/accept-payment/${orderId}`, data);
};

export const fetchAllBrands = () => {
    return api.get("/executive/brands");
};

export const fetchExecutiveAddresses = () => {
    return api.get("/executive/addresses");
};

export const createExecutiveAddress = (data) => {
    return api.post("/executive/addresses", data);
};

export const deleteExecutiveAddress = (id) => {
    return api.delete(`/executive/addresses/${id}`);
};

export const fetchExecutiveBrandSummary = () => {
    return api.get("/executive/brands/summary");
};

export const fetchExecutiveBrandDetails = (brandUserId) => {
    return api.get(`/executive/brands/${brandUserId}/details`);
};

export const fetchExecutiveAnalytics = (params) => {
    return api.get("/executive/analytics", { params });
};