import api from "./api";

export const mediatorOrderSubmit=(id,data)=>{
    return api.post(`/mediator/order/submit/${id}`,data);  
}
export const mediatorRefundSubmit=(id,data)=>{
    return api.post(`/mediator/refund/submit/${id}`,data);
}

export const getOrders=(data)=>{
    return api.get("orders/history");
}

export const getOrder=(id)=>{
    return api.get(`/order/${id}`);
}