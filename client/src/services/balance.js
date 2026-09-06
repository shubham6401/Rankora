import api from "./api";

export const sendBalancePayment = (formData) => {
    return api.post("/balance/send", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const fetchMyBalanceTransactions = () => {
    return api.get("/balance/my-transactions");
};

export const verifyBalanceTransaction = (id) => {
    return api.post(`/balance/verify/${id}`);
};

export const rejectBalanceTransaction = (id, data = {}) => {
    return api.post(`/balance/reject/${id}`, data);
};

export const fetchTeamMediators = () => {
    return api.get("/balance/team-mediators");
};
