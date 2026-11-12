import api from "./api";

export const loginAdminApi = (username, password) => {
    return api.post("/admin/login", { username, password });
};

export const fetchAdminOverview = () => {
    return api.get("/admin/overview");
};

export const createExecutiveAccountApi = (data) => {
    return api.post("/admin/create-executive", data);
};

export const fetchAdminExecutives = () => {
    return api.get("/admin/executives");
};

export const deleteExecutiveApi = (id) => {
    return api.delete(`/admin/executive/${id}`);
};

export const deleteBrandApi = (id, brandName) => {
    const target = brandName || id;
    const query = brandName ? `?brandName=${encodeURIComponent(brandName)}` : "";
    return api.delete(`/admin/brand/${encodeURIComponent(target)}${query}`);
};

export const impersonateUserApi = (userId) => {
    return api.post(`/admin/impersonate/${userId}`);
};

export const fetchExecutiveMediatorsApi = (teamCode) => {
    return api.get(`/admin/executive-mediators/${encodeURIComponent(teamCode)}`);
};

export const fetchAllMediatorsApi = () => {
    return api.get("/admin/all-mediators");
};

// Super Admin Universal Overrides (Edit Any Field & Replace Any Proof Screenshot or PDF)
export const superAdminOverrideOrderUnitApi = (orderId, unitId, formData) => {
    return api.put(`/admin/orders/${orderId}/units/${unitId}/override`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const superAdminOverrideMasterOrderApi = (orderId, data) => {
    return api.put(`/admin/orders/${orderId}/master-override`, data);
};


