import api from "../api";

export const fetchBrandOrders = () => {
    return api.get("/brand/order");
};

export const updateBrandUnitType = (orderId, unitId, unitType) => {
    return api.patch(`/brand/order/${orderId}/unit/${unitId}/type`, { unitType });
};

export const moveBrandOrderToAllCampaigns = (orderId) => {
    return api.patch(`/brand/order/${orderId}/move-to-campaigns`);
};

export const bulkUpdateBrandUnitTypes = (items, unitType) => {
    return api.patch("/brand/units/bulk-type", { items, unitType });
};

export const reportBrandUnitIssue = (orderId, unitId, { reason, details }) => {
    return api.patch(`/brand/order/${orderId}/unit/${unitId}/report-issue`, { reason, details });
};

export const resolveBrandUnitIssue = (orderId, unitId) => {
    return api.patch(`/brand/order/${orderId}/unit/${unitId}/resolve-issue`);
};

export const clearBrandUnitIssue = (orderId, unitId) => {
    return api.patch(`/brand/order/${orderId}/unit/${unitId}/clear-issue`);
};
