// graphql execution
export async function executeGraphQL(admin, mutation, variables = {}) {
  try {
    const response = await admin.graphql(
      mutation,
      { variables }, // Pass variables if required
    );

    const responseJson = await response.json();
    const responseData = responseJson.data;

    if (response.errors) {
      console.error("GraphQL Errors:", response.errors);
      throw new Error("Failed to execute GraphQL query/mutation.");
    }

    return responseData; // Return the data portion of the response
  } catch (error) {
    console.error("GraphQL Execution Error:", error.message);
    throw error;
  }
}

// get all orders
export async function fetchAllOrders(admin, query) {
  let ordersArray = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    try {
      const response = await executeGraphQL(admin, query, {
        after: cursor,
      });
      const ordersData = response.orders;

      // Extract orders from the response
      ordersArray = ordersArray.concat(
        ordersData.edges.map((edge) => edge.node),
      );

      // Update pagination info
      hasNextPage = ordersData.pageInfo.hasNextPage;
      cursor = ordersData.pageInfo.endCursor;
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      break;
    }
  }

  return ordersArray;
}
