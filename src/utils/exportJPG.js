import { toJpeg } from "html-to-image";

function rotateBase64Image90Deg(base64Image) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      resolve(canvas.toDataURL("image/jpeg", 1.0));
    };
    img.onerror = reject;
    img.src = base64Image;
  });
}

export async function exportTreeAsJPG(isLandscape = false) {
  const element = document.getElementById("tree-area");

  if (!element) {
    alert("Tree not found!");
    return;
  }

  try {
    const controls = document.querySelector(".react-flow__controls");
    const minimap = document.querySelector(".react-flow__minimap");

    if (controls) controls.style.display = "none";
    if (minimap) minimap.style.display = "none";

    let dataUrl = await toJpeg(element, {
      quality: 1,
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#0F172A",
      width: element.scrollWidth,
      height: element.scrollHeight,
      style: {
        background: "#0F172A",
      },
    });

    if (isLandscape) {
      dataUrl = await rotateBase64Image90Deg(dataUrl);
    }

    if (controls) controls.style.display = "";
    if (minimap) minimap.style.display = "";

    const link = document.createElement("a");
    const today = new Date();
    const fileName = `KaniTree_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}${isLandscape ? '_Landscape' : ''}.jpg`;

    link.download = fileName;
    link.href = dataUrl;
    link.click();

  } catch (err) {
    console.error(err);
    alert("Download failed!");
  }
}