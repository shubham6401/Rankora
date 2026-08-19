import api from "../api";

export const fetchMediatorNewOrders=()=>{
    return api.get("/mediator/new/orders");
}

export const AcceptOrderByMediator=(id)=>{
    return api.post(`/mediator/order/in_progress/${id}`);
}

export const FetchAllPendingOrders=(id)=>{
    return api.get("/mediator/orders/pending");
}
