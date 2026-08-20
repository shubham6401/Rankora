import api from "../api";

export const fetchMediatorNewOrders=()=>{
    return api.get("/mediator/new/orders");
}

export const AcceptOrderByMediator=(id)=>{
    return api.post(`/mediator/order/in_progress/${id}`);
}

export const FetchAllPendingOrders=()=>{
    return api.get("/mediator/orders/pending");
}

export const FetchAllRefund_PendingOrders=()=>{
    return api.get("/mediator/orders/refund_pending");
}

export const FetchAllCompletedOrders=()=>{
    return api.get("/mediator/orders/completed");
}