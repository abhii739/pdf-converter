const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");

const pagesEl = document.getElementById("pages");
const pageCountEl = document.getElementById("pageCount");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("emptyState");

const placeholder = document.getElementById("cameraPlaceholder");
const cameraFrame = document.querySelector(".camera-frame");

let stream = null;
let pages = [];


/* =========================
   START CAMERA
========================= */

startCameraBtn.addEventListener("click", async () => {

    try {

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: {
                    ideal: "environment"
                },
                width: {
                    ideal: 1920
                },
                height: {
                    ideal: 1080
                }
            },
            audio: false
        });

        video.srcObject = stream;

        video.style.display = "block";
        placeholder.style.display = "none";
        cameraFrame.style.display = "block";

        captureBtn.disabled = false;

        startCameraBtn.textContent = "Camera Ready";

        statusEl.textContent =
            "Camera ready. Capture your document page.";

    } catch (error) {

        console.error(error);

        alert(
            "Camera permission was denied or the camera is unavailable."
        );

    }

});


/* =========================
   CAPTURE PAGE
========================= */

captureBtn.addEventListener("click", () => {

    if (!stream) {
        alert("Please start the camera first.");
        return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        width,
        height
    );

    const image = canvas.toDataURL(
        "image/jpeg",
        0.92
    );

    pages.push(image);

    displayPages();

});


/* =========================
   UPLOAD IMAGE
========================= */

fileInput.addEventListener("change", function () {

    const files = this.files;

    if (!files.length) {
        return;
    }

    [...files].forEach(file => {

        if (!file.type.startsWith("image/")) {
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            pages.push(event.target.result);

            displayPages();

        };

        reader.readAsDataURL(file);

    });

    fileInput.value = "";

});


/* =========================
   DISPLAY PAGES
========================= */

function displayPages() {

    pagesEl.innerHTML = "";

    pages.forEach((image, index) => {

        const card = document.createElement("div");

        card.className = "page-card";

        card.innerHTML = `

            <img
                src="${image}"
                alt="Page ${index + 1}"
            >

            <button
                class="remove-page"
                type="button"
            >
                ×
            </button>

            <div class="page-number">
                Page ${index + 1}
            </div>

        `;

        card
            .querySelector(".remove-page")
            .addEventListener("click", () => {

                pages.splice(index, 1);

                displayPages();

            });

        pagesEl.appendChild(card);

    });


    /* Update page count */

    pageCountEl.textContent =
        `${pages.length} page${pages.length === 1 ? "" : "s"}`;


    /* Empty state */

    if (pages.length === 0) {

        emptyState.style.display = "block";

        downloadBtn.disabled = true;

        statusEl.textContent =
            "No pages captured yet.";

    } else {

        emptyState.style.display = "none";

        downloadBtn.disabled = false;

        statusEl.textContent =
            `${pages.length} page(s) ready for PDF.`;

    }

}


/* =========================
   DOWNLOAD PDF
========================= */

downloadBtn.addEventListener("click", async () => {

    if (pages.length === 0) {

        alert("Please capture at least one page.");

        return;

    }

    /*
       jsPDF comes from the CDN
    */

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });


    downloadBtn.disabled = true;

    downloadBtn.textContent =
        "Creating PDF...";


    try {

        for (let i = 0; i < pages.length; i++) {

            if (i > 0) {
                pdf.addPage();
            }

            const image = await loadImage(
                pages[i]
            );


            /* A4 dimensions */

            const pageWidth = 210;
            const pageHeight = 297;

            const margin = 8;

            const maxWidth =
                pageWidth - margin * 2;

            const maxHeight =
                pageHeight - margin * 2;


            /* Keep image aspect ratio */

            const scale = Math.min(
                maxWidth / image.width,
                maxHeight / image.height
            );


            const width =
                image.width * scale;

            const height =
                image.height * scale;


            /* Center image */

            const x =
                (pageWidth - width) / 2;

            const y =
                (pageHeight - height) / 2;


            pdf.addImage(
                pages[i],
                "JPEG",
                x,
                y,
                width,
                height,
                undefined,
                "FAST"
            );

        }


        /* DOWNLOAD */

        pdf.save(
            "Scan2PDF.pdf"
        );


        statusEl.textContent =
            "PDF downloaded successfully!";


    } catch (error) {

        console.error(error);

        alert(
            "Something went wrong while creating the PDF."
        );

    }


    downloadBtn.disabled = false;

    downloadBtn.textContent =
        "Download PDF";

});


/* =========================
   IMAGE LOADER
========================= */

function loadImage(src) {

    return new Promise((resolve, reject) => {

        const image = new Image();

        image.onload = () => {
            resolve(image);
        };

        image.onerror = () => {
            reject(
                new Error("Image loading failed")
            );
        };

        image.src = src;

    });

}


/* =========================
   CLEAR ALL
========================= */

clearBtn.addEventListener("click", () => {

    pages = [];

    displayPages();

});


/* =========================
   STOP CAMERA
========================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (stream) {

            stream
                .getTracks()
                .forEach(track => track.stop());

        }

    }
);
