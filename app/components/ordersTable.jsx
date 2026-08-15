import { useState } from "react";
import {
  DataTable,
  TextField,
  Pagination,
  Button,
  Text,
  Card,
  Badge,
} from "@shopify/polaris";

const OrdersTable = ({ orders, handleFullfil, handleDownloadQR }) => {
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 10;
  const filteredOrders = orders.filter((order) =>
    [
      order.name,
      order.customer.email,
      order.shippingAddress.name,
      order.billingAddress.name,
      order.fullyPaid ? "paid" : "pending",
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchValue.toLowerCase()),
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const displayedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleView = async (id) => {
    const orderidforview = id.split("/").pop();
    window.open(
      `https://app.forever-footprints.com/api/uploadmedia/qr-${orderidforview}.png`,
      "_blank",
    );

  };

  const handleQrDownload = async (id) => {
    const orderidforview = id.split("/").pop();
    window.open(
      `https://app.forever-footprints.com/api/qrgenerator/qr-${orderidforview}.png`,
      "_blank",
    );

  };

  const rows = displayedOrders.map((order) => [
    order.name,
    order.customer.email,
    order.fullyPaid ? "Paid" : "Pending",
    order.shippingAddress.name,
    order.billingAddress.name,
    new Date(order.createdAt).toLocaleDateString(),
    <div>
      {order.fulfillments[0]?.status !== "SUCCESS" ? (
        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={() => handleFullfil(order.id)} variant="primary">
            Fulfill
          </Button>
          <div><Button variant="secondary" onClick={()=>handleDownloadQR(order)}>Generate QR</Button></div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px" }}>
          <Badge progress="complete">Fulfilled</Badge>
          <div><Button variant="secondary" onClick={()=>handleQrDownload(order.id)}>Download</Button></div>
        </div>
      )}
    </div>
  ]);

  return (
    <Card>
      {/* Search Bar */}
      <div style={{ marginBottom: "20px" }}>
        <TextField
          label="Search orders"
          value={searchValue}
          onChange={(value) => {
            setSearchValue(value);
            setCurrentPage(1);
          }}
          placeholder="Search by Order ID, Order Email, Status, Ship To, or Bill To Name"
          clearButton
          onClearButtonClick={() => setSearchValue("")}
        />
      </div>

      {/* DataTable */}
      {filteredOrders.length > 0 ? (
        <DataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Order ID",
            "Order Email",
            "Status",
            "Ship To",
            "Bill To",
            "Order Date",
            "Fulfillment Status",
          ]}
          rows={rows}
        />
      ) : (
        <Text alignment="center" variant="bodyMd">
          No orders found.
        </Text>
      )}

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <Text>
            Page {currentPage} of {totalPages}
          </Text>
          <Pagination
            hasPrevious={currentPage > 1}
            onPrevious={() => setCurrentPage(currentPage - 1)}
            hasNext={currentPage < totalPages}
            onNext={() => setCurrentPage(currentPage + 1)}
          />
        </div>
      )}
    </Card>
  );
};

export default OrdersTable;
