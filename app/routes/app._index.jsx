import { useEffect, useState, useCallback } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  TextField,
  Select,
  Button,
  InlineGrid,
  Modal,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { fetchAllOrders, executeGraphQL } from "../graphql/graphql";
import {
  getAllOrdersQuery,
  getFulfillmentOrdersQuery,
  fulfillmentCreateMutation,
  getCarrierServicesQuery,
} from "../graphql/graphqlQuery";
import OrdersTable from "../components/ordersTable";
import { updateOrderFulfillmentStatus } from "../helper/helper";
import axios from "axios";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const orders = await fetchAllOrders(admin, getAllOrdersQuery);
  const carrierServices = await executeGraphQL(admin, getCarrierServicesQuery);
  const carrierServicesOptions =
    carrierServices.availableCarrierServices.map(({ carrierService }) => ({
      label: carrierService.formattedName,
      value: carrierService.name,
    })) || [];

  return { orders, carrierServices, carrierServicesOptions };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const method = request.method;

  switch (method) {
    case "POST": {
      const formCreateData = new URLSearchParams(await request.text());
      const data = formCreateData.get("data");
      const { orderId, trackingNumber, carrierServiceId, order } =
        JSON.parse(data);

      if (!orderId) {
        return { success: false, message: "Order ID is required", status: 400 };
      }

      try {
        // Step 1: Fetch Fulfillment Orders for the Order
        const fulfillmentOrdersResponse = await executeGraphQL(
          admin,
          getFulfillmentOrdersQuery,
          {
            orderId,
          },
        );

        const fulfillmentOrders =
          fulfillmentOrdersResponse?.order?.fulfillmentOrders?.edges;

        if (!fulfillmentOrders || fulfillmentOrders.length === 0) {
          return {
            success: false,
            message: "No fulfillment orders found for this order",
            status: 404,
          };
        }

        // Step 2: Prepare Fulfillment Input
        const lineItemsByFulfillmentOrder = fulfillmentOrders.map((fo) => ({
          fulfillmentOrderId: fo.node.id,
          fulfillmentOrderLineItems: fo.node.lineItems.edges.map((li) => {
            const quantity = li.node.totalQuantity; // Ensure this matches the available quantity
            if (quantity <= 0) {
              throw new Error(
                `Invalid quantity for line item ${li.node.id}: ${quantity}`,
              );
            }
            return {
              id: li.node.id,
              quantity,
            };
          }),
        }));

        const fulfillmentInput = {
          lineItemsByFulfillmentOrder,
          trackingInfo: {
            number: trackingNumber,
            company: carrierServiceId,
          },
          notifyCustomer: true,
        };

        // Step 3: Create Fulfillment
        const fulfillmentResponse = await executeGraphQL(
          admin,
          fulfillmentCreateMutation,
          {
            fulfillment: fulfillmentInput,
          },
        );

        const userErrors = fulfillmentResponse?.fulfillmentCreate?.userErrors;

        if (userErrors && userErrors.length > 0) {
          return { success: false, message: "Fulfillment failed", status: 400 };
        }

        let orderidforview = orderId.split("/").pop();

        // Fetch the real QR code URL from forever-main (same call the
        // "Generate QR" button makes) instead of guessing a URL — that
        // guessed path was never a real file-serving route and always 404'd.
        let qrCodeUrl = null;
        try {
          const orderResponse = await axios.post(
            "https://app.forever-footprints.com/api/order/",
            {
              orderId: orderidforview,
              status: "pending",
              redirectUrl: "",
              items: order?.currentSubtotalLineItemsQuantity,
              email: order?.customer?.email,
            },
          );
          qrCodeUrl = orderResponse.data.qrCode;
        } catch (error) {
          console.error(
            "Error fetching QR code after fulfillment:",
            error.response?.data || error.message,
          );
        }

        return {
          success: true,
          message: "Fulfillment created successfully",
          url: qrCodeUrl,
          status: 200,
        };
      } catch (error) {
        console.error("Error fulfilling order:", error.message);
        return {
          success: false,
          message: "Internal server error",
          status: 500,
        };
      }
    }

    case "PUT": {
      const formCreateData = new URLSearchParams(await request.text());
      let data = formCreateData.get("data");
      data = JSON.parse(data);
      try {
        const response = await axios.post(
          "https://app.forever-footprints.com/api/order/",
          data
        );
        return {
          success: true,
          message: "Qr code created successfully",
          url: response.data.qrCode,
          status: 200,
        };
      } catch (error) {
        console.error("Error creating order/QR code:", error.response?.data || error.message);
        return {
          success: false,
          message: "Failed to generate QR code",
          status: 500,
        };
      }
    }

    default:
      return { success: false, message: "Method not allowed", status: 405 };
  }
};

export default function Index() {
  const { orders, carrierServicesOptions } = useLoaderData();
  const fetcher = useFetcher();
  const [shopOrders, setShopOrders] = useState(orders);
  const [formActive, setFormActive] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selected, setSelected] = useState(carrierServicesOptions[0].value);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openQrModal, setOpenQrModal] = useState(null);

  const handleSelectChange = useCallback((value) => setSelected(value), []);

  const handleFullfil = (id) => {
    setSelectedOrder(id);
    setFormActive(true);
  };

  const handleSubmit = () => {
    setIsLoading(true);

    const data = {
      orderId: selectedOrder,
      trackingNumber: trackingNumber,
      carrierServiceId: selected,
      order: orders.find((order) => order.id === selectedOrder),
    };

    fetcher.submit(
      {
        data: JSON.stringify(data),
      },
      { method: "post" },
    );
  };

  const handleDownloadQR = async (order) => {
    setIsLoading(true);
    let orderidforview = order.id.split("/").pop();
    const data = {
      orderId: orderidforview,
      status: "pending",
      redirectUrl: "",
      items: order.currentSubtotalLineItemsQuantity,
      email: order.customer.email,
    };

    fetcher.submit(
      {
        data: JSON.stringify(data),
      },
      { method: "put" },
    );
  };


  useEffect(() => {
    // console.log("orders:", orders);
  }, []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const { success, url } = fetcher.data;

      if (success) {
        setOpenQrModal(url);
        console.log("success");
        const updatedOrders = updateOrderFulfillmentStatus(
          shopOrders,
          selectedOrder,
        );
        setShopOrders(updatedOrders);
        setSelectedOrder(null);
        setTrackingNumber("");
        setSelected(carrierServicesOptions[0].value);

        // const order = orders.find((order) => order.id === selectedOrder);

        // async function postToForever() {
        //   const response = await axios.post(
        //     "https://app.forever-footprints.com/api/order/",
        //     {
        //       status: "pending",
        //       redirectUrl: "",
        //       items: order.currentSubtotalLineItemsQuantity,
        //       email: order.customer.email,
        //     },
        //   );

        //   console.log("response:", response);
        // }

        // postToForever();

        setIsLoading(false);
        setFormActive(false);
      } else {
        console.log("error");
        setIsLoading(false);
      }
    }
    // Deliberately keyed only on fetcher state/data - this should react to a
    // new fetcher response, not to our own resulting state updates (adding
    // shopOrders/selectedOrder/carrierServicesOptions would re-run the body
    // every time this effect sets them, re-processing the same response).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  return (
    <Page fullWidth={true}>
      <TitleBar title="Orders"></TitleBar>

      
        <Modal size="small" open={openQrModal} onClose={() => setOpenQrModal(null)}>
          <Modal.Section>
              <p>QR Code</p>
              <img src={openQrModal} alt="QR Code" width="100%"/>
              <Button url={openQrModal} target="_blank" onClick={() => setOpenQrModal(null)}>Download</Button>
          </Modal.Section>
        </Modal>
      
      <Modal size="medium" open={formActive} onClose={() => setFormActive(false)}>
        <Modal.Section>
        <div
            style={{
              padding: "20px 10px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            <InlineGrid gap="400" columns={2}>
              <TextField
                label="Tracking number"
                value={trackingNumber}
                onChange={(value) => setTrackingNumber(value)}
                placeholder="Enter tracking number"
              />
              <Select
                label="Select a carrier"
                options={carrierServicesOptions}
                onChange={handleSelectChange}
                value={selected}
              />
            </InlineGrid>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <Button onClick={() => setFormActive(false)}>Close</Button>
              <Button
                variant="primary"
                loading={isLoading}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </div>
          </div>
        </Modal.Section>
      </Modal>

        <OrdersTable orders={shopOrders} handleFullfil={handleFullfil} handleDownloadQR={handleDownloadQR} />
    </Page>
  );
}
