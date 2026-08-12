const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const fileInput = document.getElementById("fileInput");
const pagesEl = document.getElementById("pages");
const pageCountEl = document.getElementById("pageCount");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("emptyState");
const placeholder = document.getElementById("cameraPlaceholder");
const cameraFrame = document.querySelector(".camera-frame");
const toast = document.getElementById("toast");

let stream = null;
let pages = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

async function startCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API is not supported in this browser.");
    }

    if (stream) stream.getTracks().forEach(t => t.stop());

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    });

    video.srcObject = stream;
    video.style.display = "block";
    placeholder.style.display = "none";
    cameraFrame.style.display = "block";
    captureBtn.disabled = false;
    startCameraBtn.textContent = "Restart Camera";
    statusEl.textContent = "Camera ready. Capture the first page.";
  } catch (err) {
    console.error(err);
    showToast("Camera access failed. Use Upload Photo instead.");
    statusEl.textContent = "Camera unavailable. You can still upload photos.";
  }
}

function capturePage() {
  if (!stream || video.readyState < 2) return;

  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  addPage(dataUrl);
}

function addPage(dataUrl) {
  pages.push(dataUrl);
  renderPages();
  statusEl.textContent = `Page ${pages.length} captured.`;
}

function handleFiles(files) {
  [...files].forEach(file => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = e => addPage(e.target.result);
    reader.readAsDataURL(file);
  });

  fileInput.value = "";
}

function renderPages() {
  pagesEl.innerHTML = "";

  pages.forEach((src, index) => {
    const card = document.createElement("div");
    card.className = "page-card";
    card.innerHTML = `
      <img src="${src}" alt="Scanned page ${index + 1}">
      <button class="remove-page" type="button" aria-label="Remove page ${index + 1}">×</button>
      <div class="page-number">Page ${index + 1}</div>
    `;

    card.querySelector(".remove-page").addEventListener("click", () => {
      pages.splice(index, 1);
      renderPages();
      statusEl.textContent = pages.length
        ? `${pages.length} page(s) ready.`
        : "No pages captured yet.";
    });

    pagesEl.appendChild(card);
  });

  const hasPages = pages.length > 0;
  emptyState.style.display = hasPages ? "none" : "block";
  downloadBtn.disabled = !hasPages;
  pageCountEl.textContent = `${pages.length} page${pages.length === 1 ? "" : "s"}`;
}

async function downloadPDF() {
  if (!pages.length) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  downloadBtn.disabled = true;
  downloadBtn.textContent = "Creating PDF...";

  try {
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();

      const img = await loadImage(pages[i]);
      const pageW = 210;
      const pageH = 297;
      const margin = 8;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (pageW - w) / 2;
      const y = (pageH - h) / 2;

      pdf.addImage(pages[i], "JPEG", x, y, w, h, undefined, "FAST");
    }

    pdf.save(`Scan2PDF-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast("PDF created successfully.");
  } catch (err) {
    console.error(err);
    showToast("Could not create the PDF.");
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = "Download PDF";
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function clearAll() {
  pages = [];
  renderPages();
  statusEl.textContent = "No pages captured yet.";
}

startCameraBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePage);
fileInput.addEventListener("change", e => handleFiles(e.target.files));
downloadBtn.addEventListener("click", downloadPDF);
clearBtn.addEventListener("click", clearAll);

window.addEventListener("beforeunload", () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
});

renderPages();
