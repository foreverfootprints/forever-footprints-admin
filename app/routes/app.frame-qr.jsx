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

// Generates a QR code for the custom-frame product's video/audio clip.
// The clip itself lives on YouTube/Vimeo (uploaded there manually after
// pulling it off the order) — this just turns that link into a printable
// QR code, reusing the same QR-generation pipeline as the tribute pages.
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

export default function FrameQr() {
  const fetcher = useFetcher();
  const [orderName, setOrderName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const isLoading = fetcher.state !== "idle";

  const handleGenerate = () => {
    fetcher.submit({ orderName, videoUrl }, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="Frame QR Code" />
      <Card>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            After uploading the customer's video or audio clip to YouTube or Vimeo, paste that
            link here to generate the QR code that gets printed on the frame.
          </Text>

          <TextField
            label="Order # (optional, keeps regenerating the same QR instead of a new one)"
            value={orderName}
            onChange={setOrderName}
            autoComplete="off"
            placeholder="e.g. 1039"
          />

          <TextField
            label="YouTube / Vimeo link"
            value={videoUrl}
            onChange={setVideoUrl}
            autoComplete="off"
            placeholder="https://youtube.com/watch?v=..."
          />

          <Button variant="primary" onClick={handleGenerate} loading={isLoading} disabled={!videoUrl}>
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
