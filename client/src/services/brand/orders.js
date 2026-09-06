import api from "../api";

export const fetchBrandOrders = () => {
    return api.get("/brand/order");
};
