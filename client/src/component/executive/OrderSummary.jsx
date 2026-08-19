
export default function OrderSummary({orders}){
    console.log(orders);
    let pending_orders=0,assigned_orders=0,in_progress_orders=0,pending_refund_orders=0,completed_orders=0;
    orders.forEach((order)=>{
        if(order.status==="pending") pending_orders++;
        else if(order.status==="assigned") assigned_orders++;
        else if(order.status==="in_progress") in_progress_orders++;
        else if(order.status==="pending_refund") pending_refund_orders++;
        else if(order.status==="completed") completed_orders++;

    });
    return(
        <div>
            <p> <b>Order Summary</b></p>
            <p>Total Orders:{orders.length}</p>
            <p>Pending Orders:{pending_orders}</p>
            <p>Assigned Orders:{assigned_orders}</p>
            <p>In_progress Orders:{in_progress_orders}</p>
            <p>Pending_Refund Orders:{pending_refund_orders}</p>
            <p>Completed Orders:{completed_orders}</p>
        </div>
    )
}