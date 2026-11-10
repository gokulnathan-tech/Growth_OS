import { toJpeg, toBlob } from "html-to-image";

// Reusable configuration for HD output
const hdConfig = {
  quality: 1,
  pixelRatio: 3, // Multiplies pixels for HD resolution
  cacheBust: true,
  backgroundColor: "#FFFFFF",
  style: {
    transform: 'scale(1)',
    margin: '0',
  },
};

export async function exportPurchaseAsJPG() {
  const element = document.getElementById("purchase-preview");

  if (!element) {
    alert("Preview area not found!");
    return;
  }

  try {
    const dataUrl = await toJpeg(element, hdConfig);

    const link = document.createElement("a");
    const today = new Date();
    const fileName = `Kani_Purchase_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.jpg`;

    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error(err);
    alert("Download failed!");
  }
}

export async function sharePurchaseAsImage() {
  const element = document.getElementById("purchase-preview");

  if (!element) {
    alert("Preview area not found!");
    return;
  }

  try {
    // Generate an HD Blob (File Data) instead of a Data URL
    const blob = await toBlob(element, hdConfig);
    const file = new File([blob], "Kani_Purchase_Summary.jpg", { type: "image/jpeg" });

    // Check if the device/browser supports file sharing
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Purchase Summary",
        text: "Here is the HD purchase summary.",
        files: [file],
      });
    } else {
      alert("Direct image sharing is not supported on this browser. Please download the JPG and share it manually.");
    }
  } catch (err) {
    console.error("Share failed:", err);
    alert("Failed to open share menu.");
  }
}