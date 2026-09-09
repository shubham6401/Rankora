import api from "../api";

export const fetchMediatorSummary = () => {
    return api.get("/mediator/summary");
};

export const fetchMediatorNewOrders = () => {
    return api.get("/mediator/new/orders");
};

export const AcceptOrderByMediator = (id, quantity) => {
    return api.post(`/mediator/order/accept/${id}`, { quantity });
};

export const RejectOrderByMediator = (id, quantity) => {
    return api.post(`/mediator/order/reject/${id}`, { quantity });
};

export const fetchMediatorPendingPaymentOrders = () => {
    return api.get("/mediator/orders/pending_payment");
};

export const submitMediatorPaymentProof = (id, formData) => {
    return api.post(`/mediator/order/submit-payment/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const FetchAllPendingOrders = () => {
    return api.get("/mediator/orders/pending");
};

export const FetchAllRefund_PendingOrders = () => {
    return api.get("/mediator/orders/refund_pending");
};

export const FetchAllPendingVerificationOrders = () => {
    return api.get("/mediator/orders/pending_verification");
};

export const FetchAllCompletedOrders = () => {
    return api.get("/mediator/orders/completed");
};