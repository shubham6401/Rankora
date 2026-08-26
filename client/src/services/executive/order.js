import api from "../api";


export const fetchAllExecutiveOrders=()=>{ 
    return api.post("/executive/orders");
}

export const fetchAllExecutivePendingOrders=()=>{
    return api.get("/executive/orders/pending");
}

export const fetchAllExecutiveAssignedOrders=()=>{
    return api.get("/executive/orders/assigned");
}

export const fetchAllExecutiveIn_ProgressOrders=()=>{
    return api.get("/executive/orders/in_progress");
}

export const fetchAllExecutivePending_RefundOrders=()=>{
    return api.get("/executive/orders/pending_refund");
}

export const fetchAllExecutiveCompletedOrders=()=>{
    return api.get("/executive/orders/completed");
}

export const addExecutiveOrder=(data)=>{
    return api.post("/executive/order/add",data);
}

export const fetchAllMediators=()=>{
    return api.get("/executive/mediators");
}

export const AssignOrderToMediator=(id,data)=>{
    return api.post(`/executive/order/assign/${id}`,data);
}

export const fetchAllBrands=()=>{
    return api.get("/executive/brands");
}