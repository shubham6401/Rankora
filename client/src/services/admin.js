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
