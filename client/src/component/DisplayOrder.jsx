import { useState,useEffect } from "react";

export default function DisplayOrder({ order }) {
    return (
        <div>
            <h2>Order Details</h2>

            <div>
                <p>
                    <b>Order ID:</b>{" "}
                    {order.orderId || "Not Submitted Yet"}
                </p>

                <p>
                    <b>Product Name:</b> {order.productName}
                </p>

                <p>
                    <b>Product Link:</b>{" "}
                    {order.productLink ? (
                        <a
                            href={order.productLink}
                            target="_blank"
                            rel="noreferrer"
                        >
                            View Product
                        </a>
                    ) : (
                        "Not Submitted Yet"
                    )}
                </p>

                <p>
                    <b>Price:</b> {order.price}
                </p>

                <p>
                    <b>Brand:</b> {order.brand}
                </p>

                <p>
                    <b>Platform:</b> {order.orderPlatform}
                </p>

                <p>
                    <b>Reviewer Name:</b> {order.reviewerName || "Not Submitted Yet"}
                </p>

                <p>
                    <b>Team Code:</b> {order.teamCode}
                </p>

                <p>
                    <b>Status:</b> {order.status}
                </p>

                <p>
                    <b>Created On:</b>{" "}
                    {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "Not Available"}
                </p>
            </div>

            <hr />
            <h3>Mediator Details</h3>
            {order.status === "assigned" ? (
                <div>
                    <p>
                        <b>Mediator ID:</b>{" "}
                        {order.assignedTo._id}
                    </p>
                    <p>
                        <b>Mediator Name:</b>{" "}
                        {order.assignedTo.name}
                    </p>
                    <p>
                        <b>Mediator Code:</b>{" "}
                        {order.assignedTo.mediatorCode}
                    </p>
                

                </div>

            ) : "Not Assigned Yet"}

            <hr />

            <h3>Mediator / Order Placement Details</h3>

            <p>
                <b>Order ID:</b>{" "}
                {order.orderId || "Not Submitted Yet"}
            </p>

            <p>
                <b>Ordered Screenshot:</b>
            </p>

            {order.orderedScreenshot ? (
                <img
                    src={order.orderedScreenshot}
                    width="500"
                    alt="Ordered Screenshot"
                />
            ) : (
                <p>Not Submitted Yet</p>
            )}

            <p>
                <b>Expected Arrival Date:</b>{" "}
                {order.expectedArrivalDate
                    ? new Date(order.expectedArrivalDate).toLocaleString()
                    : "Not Submitted Yet"}
            </p>

            <p>
                <b>Address:</b>{" "}
                {order.address || "Not Submitted Yet"}
            </p>

            <p>
                <b>Order Received On:</b>{" "}
                {order.orderReceivedOn
                    ? new Date(order.orderReceivedOn).toLocaleString()
                    : "Not Submitted Yet"}
            </p>

            <p>
                <b>Season:</b>{" "}
                {order.season || "Not Submitted Yet"}
            </p>

            <hr />

            <h3>Refund Details</h3>

            {!order.postDeliveryDetails?.success ? (
                <p>Refund details are not added yet.</p>
            ) : (
                <div>
                    <p>
                        <b>Product Review Screenshot</b>
                    </p>

                    {order.postDeliveryDetails.productReviewScreenshot && (
                        <img
                            src={order.postDeliveryDetails.productReviewScreenshot}
                            width="500"
                            alt="Product Review Screenshot"
                        />
                    )}

                    <hr />

                    <p>
                        <b>Invoice Screenshot</b>
                    </p>

                    {order.postDeliveryDetails.invoiceScreenshot && (
                        <img
                            src={order.postDeliveryDetails.invoiceScreenshot}
                            width="500"
                            alt="Invoice Screenshot"
                        />
                    )}

                    <hr />

                    <p>
                        <b>Seller Feedback Screenshot</b>
                    </p>

                    {order.postDeliveryDetails.sellerFeedbackScreenShot && (
                        <img
                            src={order.postDeliveryDetails.sellerFeedbackScreenShot}
                            width="500"
                            alt="Seller Feedback Screenshot"
                        />
                    )}
                </div>
            )}
        </div>
    );
}