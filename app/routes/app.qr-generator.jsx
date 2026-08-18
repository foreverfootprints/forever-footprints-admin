import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Page, Card, TextField, Button, BlockStack, Text, Banner } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import axios from "axios";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

// General-purpose QR code generator for any product that needs one printed
// (the custom frame today, the LED acrylic block product later, etc). Paste
// any link — usually a YouTube/Vimeo video hosted after pulling it off an
// order — and get back a printable QR code, reusing the same QR-generation
// pipeline as the tribute pages.
export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();
  const orderName = formData.get("orderName");
  const videoUrl = formData.get("videoUrl");

  if (!videoUrl) {
    return { success: false, message: "Paste the video/audio link first." };
  }

  try {
    const response = await axios.post("https://app.forever-footprints.com/api/qrcode", {
      name: orderName || undefined,
      url: videoUrl,
    });
    return { success: true, qrCodeUrl: response.data.qrCodeUrl };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.error || "Something went wrong generating the QR code.",
    };
  }
};

export default function QrGenerator() {
  const fetcher = useFetcher();
  const [orderName, setOrderName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const isLoading = fetcher.state !== "idle";

  const handleGenerate = () => {
    fetcher.submit({ orderName, videoUrl: linkUrl }, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="QR Code Generator" />
      <Card>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            Paste any link — usually a video hosted on YouTube or Vimeo after pulling it off an
            order — to generate a printable QR code for it. Works for any product that needs one:
            frames today, the LED acrylic block later.
          </Text>

          <TextField
            label="Order # (optional, keeps regenerating the same QR instead of a new one)"
            value={orderName}
            onChange={setOrderName}
            autoComplete="off"
            placeholder="e.g. 1039"
          />

          <TextField
            label="Link to encode"
            value={linkUrl}
            onChange={setLinkUrl}
            autoComplete="off"
            placeholder="https://youtube.com/watch?v=..."
          />

          <Button variant="primary" onClick={handleGenerate} loading={isLoading} disabled={!linkUrl}>
            Generate QR code
          </Button>

          {fetcher.data && !fetcher.data.success && (
            <Banner tone="critical">{fetcher.data.message}</Banner>
          )}

          {fetcher.data?.success && (
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Right-click the image below to save it for printing:
              </Text>
              <img
                src={fetcher.data.qrCodeUrl}
                alt="Generated QR code"
                style={{ width: 220, height: 220 }}
              />
              <Text as="p" variant="bodySm" tone="subdued">
                {fetcher.data.qrCodeUrl}
              </Text>
            </BlockStack>
          )}
        </BlockStack>
      </Card>
    </Page>
  );
}
