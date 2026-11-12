import api from "../api";

// In-Memory Fast Cache with Stale-While-Revalidate (15s TTL)
const mediatorCache = new Map();
const CACHE_TTL = 15000;

export const clearMediatorCache = () => {
    mediatorCache.clear();
};

const cachedGet = async (url, config = {}) => {
    const key = `GET:${url}:${config.params ? JSON.stringify(config.params) : ""}`;
    const now = Date.now();
    const hit = mediatorCache.get(key);

    if (hit && now - hit.timestamp < CACHE_TTL) {
        api.get(url, config).then((fresh) => {
            mediatorCache.set(key, { data: fresh, timestamp: Date.now() });
        }).catch(() => {});
        return hit.data;
    }

    const res = await api.get(url, config);
    mediatorCache.set(key, { data: res, timestamp: now });
    return res;
};

export const fetchMediatorSummary = () => {
    return cachedGet("/mediator/summary");
};

export const fetchMediatorNewOrders = () => {
    return cachedGet("/mediator/new/orders");
};

export const AcceptOrderByMediator = async (id, quantity) => {
    clearMediatorCache();
    return api.post(`/mediator/order/accept/${id}`, { quantity });
};

export const RejectOrderByMediator = async (id, quantity) => {
    clearMediatorCache();
    return api.post(`/mediator/order/reject/${id}`, { quantity });
};

export const fetchMediatorPendingPaymentOrders = () => {
    return cachedGet("/mediator/orders/pending_payment");
};

export const submitMediatorPaymentProof = async (id, formData) => {
    clearMediatorCache();
    return api.post(`/mediator/order/submit-payment/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const FetchAllPendingOrders = () => {
    return cachedGet("/mediator/orders/pending");
};

export const FetchAllRefund_PendingOrders = () => {
    return cachedGet("/mediator/orders/refund_pending");
};

export const FetchAllPendingVerificationOrders = () => {
    return cachedGet("/mediator/orders/pending_verification");
};

export const FetchAllCompletedOrders = () => {
    return cachedGet("/mediator/orders/completed");
};

export const batchAcceptOrdersByMediator = async (items) => {
    clearMediatorCache();
    return api.post("/mediator/order/batch-accept", { items });
};

export const batchRejectOrdersByMediator = async (items) => {
    clearMediatorCache();
    return api.post("/mediator/order/batch-reject", { items });
};

export const returnMediatorOrderUnit = async (unitId, reason, quantity = 1) => {
    clearMediatorCache();
    return api.post(`/mediator/order/return/${unitId}`, { reason, quantity });
};

export const confirmMediatorSettlementPayment = async (data) => {
    clearMediatorCache();
    return api.post("/mediator/order/confirm-settlement", data);
};

export const FetchAllSettledOrders = () => {
    return cachedGet("/mediator/orders/settled");
};

export const fetchMediatorEarnings = () => {
    return cachedGet("/mediator/earnings");
};

// Platform IDs Management
export const fetchMediatorPlatformIds = () => {
    return cachedGet("/mediator/ids");
};

export const addMediatorPlatformId = async (data) => {
    clearMediatorCache();
    return api.post("/mediator/ids", data);
};

export const updateMediatorPlatformId = async (id, data) => {
    clearMediatorCache();
    return api.put(`/mediator/ids/${id}`, data);
};

export const deleteMediatorPlatformId = async (id) => {
    clearMediatorCache();
    return api.delete(`/mediator/ids/${id}`);
};

// Mediator Order Command Center / Tracker
export const fetchMediatorTrackedOrders = (params) => {
    return cachedGet("/mediator/tracker", { params });
};
