import api from "./api";

export const orderSubmit=(data)=>{
    return api.post("orders/success",data);  
}
export const refundSubmit=(id,data)=>{
    return api.post(`order/refund/${id}`,data);
}

export const getOrders=(data)=>{
    return api.get("orders/history");
}

export const getOrder=(id)=>{
    return api.get(`/order/${id}`);
}