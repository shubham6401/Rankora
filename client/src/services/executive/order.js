import api from "../api";

// In-Memory Fast Cache with Stale-While-Revalidate (15s TTL)
const executiveCache = new Map();
const CACHE_TTL = 15000;

export const clearExecutiveCache = () => {
    executiveCache.clear();
};

const cachedGet = async (url, config = {}) => {
    const key = `GET:${url}:${config.params ? JSON.stringify(config.params) : ""}`;
    const now = Date.now();
    const hit = executiveCache.get(key);

    if (hit && now - hit.timestamp < CACHE_TTL) {
        // Return cached response instantly and revalidate in background
        api.get(url, config).then((fresh) => {
            executiveCache.set(key, { data: fresh, timestamp: Date.now() });
        }).catch(() => {});
        return hit.data;
    }

    const res = await api.get(url, config);
    executiveCache.set(key, { data: res, timestamp: now });
    return res;
};

const cachedPost = async (url, payload = {}) => {
    const key = `POST:${url}:${JSON.stringify(payload)}`;
    const now = Date.now();
    const hit = executiveCache.get(key);

    if (hit && now - hit.timestamp < CACHE_TTL) {
        api.post(url, payload).then((fresh) => {
            executiveCache.set(key, { data: fresh, timestamp: Date.now() });
        }).catch(() => {});
        return hit.data;
    }

    const res = await api.post(url, payload);
    executiveCache.set(key, { data: res, timestamp: now });
    return res;
};

export const fetchAllExecutiveOrders = () => {
    return cachedPost("/executive/orders");
};

export const fetchAllExecutivePendingOrders = () => {
    return cachedGet("/executive/orders/pending");
};

export const fetchAllExecutivePendingPaymentOrders = () => {
    return cachedGet("/executive/orders/pending_payment");
};

export const fetchAdvancePaymentHistory = () => {
    return cachedGet("/executive/orders/advance_payment_history");
};

export const fetchAllExecutiveAssignedOrders = () => {
    return cachedGet("/executive/orders/assigned");
};

export const fetchAllExecutiveIn_ProgressOrders = () => {
    return cachedGet("/executive/orders/in_progress");
};

export const fetchAllExecutivePending_RefundOrders = () => {
    return cachedGet("/executive/orders/pending_refund");
};

export const fetchAllExecutivePendingVerificationOrders = () => {
    return cachedGet("/executive/orders/pending_verification");
};

export const fetchAllExecutiveCompletedOrders = () => {
    return cachedGet("/executive/orders/completed");
};

export const fetchSettledOrders = () => {
    return cachedGet("/executive/orders/settled");
};

export const settleExecutivePayout = async (formData) => {
    clearExecutiveCache();
    return api.post("/executive/order/settle-payout", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const verifyExecutiveOrderUnit = async (data) => {
    clearExecutiveCache();
    return api.post("/executive/order/verify-unit", data);
};

export const rejectExecutiveOrderUnitVerification = async (data) => {
    clearExecutiveCache();
    return api.post("/executive/order/reject-unit-verification", data);
};

export const addExecutiveOrder = async (data) => {
    clearExecutiveCache();
    return api.post("/executive/order/add", data);
};

export const fetchAllMediators = () => {
    return cachedGet("/executive/mediators");
};

export const AssignOrderToMediator = async (id, data) => {
    clearExecutiveCache();
    return api.post(`/executive/order/assign/${id}`, data);
};

export const unassignExecutiveOrderUnit = async (data) => {
    clearExecutiveCache();
    return api.post("/executive/order/unassign", data);
};

export const submitExecutivePaymentProof = async (mediatorId, formData) => {
    clearExecutiveCache();
    return api.post(`/executive/order/submit-payment/${mediatorId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const fetchExecutiveMediatorSentOrders = () => {
    return cachedGet("/executive/orders/mediator_sent");
};

export const acceptExecutiveMediatorPayment = async (orderId, data) => {
    clearExecutiveCache();
    return api.post(`/executive/order/accept-payment/${orderId}`, data);
};

export const fetchAllBrands = () => {
    return cachedGet("/executive/brands");
};

export const fetchExecutiveAddresses = () => {
    return cachedGet("/executive/addresses");
};

export const createExecutiveAddress = async (data) => {
    clearExecutiveCache();
    return api.post("/executive/addresses", data);
};

export const deleteExecutiveAddress = async (id) => {
    clearExecutiveCache();
    return api.delete(`/executive/addresses/${id}`);
};

export const fetchExecutiveBrandSummary = () => {
    return cachedGet("/executive/brands/summary");
};

export const fetchExecutiveBrandDetails = (brandUserId) => {
    return cachedGet(`/executive/brands/${brandUserId}/details`);
};

export const fetchExecutiveAnalytics = (params) => {
    return cachedGet("/executive/analytics", { params });
};

export const fetchExecutiveMediatorEarnings = () => {
    return cachedGet("/executive/mediators-earnings");
};

export const deleteExecutiveOrderBatch = async (orderId) => {
    clearExecutiveCache();
    return api.delete(`/executive/order/${orderId}`);
};

// Mediator Platform IDs Oversight
export const fetchExecutiveMediatorIds = (mediatorId) => {
    return cachedGet(`/executive/mediators/${mediatorId}/ids`);
};

export const toggleMediatorIdStatus = async (mediatorId, id, data) => {
    clearExecutiveCache();
    return api.patch(`/executive/mediators/${mediatorId}/ids/${id}/status`, data);
};

// Executive to Executive Assignment & Transfers
export const fetchPeerExecutives = () => {
    return cachedGet("/executive/peer-executives");
};

export const transferOrderToExecutive = async (formData) => {
    clearExecutiveCache();
    return api.post("/executive/order/transfer-to-executive", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const fetchTransferredInOrders = () => {
    return cachedGet("/executive/orders/transferred-in");
};

export const fetchTransferredOutOrders = () => {
    return cachedGet("/executive/orders/transferred-out");
};

// Unit Level Deletion & Operational Field Editing
export const deleteSingleExecutiveOrderUnit = async (orderId, unitId) => {
    clearExecutiveCache();
    return api.delete(`/executive/orders/${orderId}/units/${unitId}`);
};

export const bulkDeleteExecutiveOrderUnits = async (orderId, unitIds) => {
    clearExecutiveCache();
    return api.post(`/executive/orders/${orderId}/units/bulk-delete`, { unitIds });
};

export const editExecutiveOrderUnit = async (orderId, unitId, data) => {
    clearExecutiveCache();
    return api.put(`/executive/orders/${orderId}/units/${unitId}`, data);
};
