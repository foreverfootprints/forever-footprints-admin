// get all orders
export const getAllOrdersQuery = `#graphql
query GetAllOrders($after: String) {
  orders(first: 250, after: $after) {
    edges {
      node {
        id
        name
        createdAt
        fullyPaid
        currentSubtotalLineItemsQuantity
        customer {
          id
          firstName
          lastName
          email
        }
        shippingAddress {
          name
          company
          address1
          address2
          city
          province
          zip
          country
        }
        billingAddress {
          name
          company
          address1
          address2
          city
          province
          zip
          country
        }
        fulfillments{
          id
          status
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

// Get Fulfillment Orders Query
export const getFulfillmentOrdersQuery = `#graphql
  query getFulfillmentOrders($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      fulfillmentOrders(first: 10) {
        edges {
          node {
            id
            status
            lineItems(first: 10) {
              edges {
                node {
                  id
                  totalQuantity
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Fulfillment Create Mutation
export const fulfillmentCreateMutation = `#graphql
  mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
    fulfillmentCreate(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
        trackingInfo {
          number
          company
        }
        createdAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Get Carrier Services Query
export const getCarrierServicesQuery = `#graphql
  query{
    availableCarrierServices{
      carrierService{
        formattedName
        id
        active
        name
      }
    }
  }
`;
