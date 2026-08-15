
// update order fullfilment
export const updateOrderFulfillmentStatus = (orders, orderId) => {
  return orders.map((order) => {
    if (order.id === orderId) {
      const updatedOrder = { ...order }; // Create a shallow copy of the order
      if (updatedOrder.fulfillments && updatedOrder.fulfillments.length > 0) {
        // Update the status of the first fulfillment
        updatedOrder.fulfillments[0].status = "SUCCESS";
      } else {
        // Add a new fulfillment if none exist
        updatedOrder.fulfillments = [
          {
            id: `gid://shopify/Fulfillment/${Date.now()}`, // Generate a unique ID
            status: "SUCCESS",
          },
        ];
      }
      return updatedOrder; // Return the updated order
    }
    return order; // Return the original order if not matched
  });
};
