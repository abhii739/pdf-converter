# Scan2PDF — Mobile Camera to PDF

A simple Flask web app that lets a user:

1. Open the app on a mobile phone.
2. Start the rear camera.
3. Capture one document/photo at a time.
4. Add multiple pages.
5. Remove unwanted pages.
6. Download one PDF where each captured image becomes one PDF page.

## Run locally

```bash
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

Install:
```bash
pip install -r requirements.txt
```

Run:
```bash
python app.py
```

Open:
```text
http://127.0.0.1:5000
```

## Using the phone camera

For camera access, browsers normally require HTTPS or localhost.

For testing on a phone over the same Wi-Fi network, run Flask with the host `0.0.0.0` as already configured, then open the computer's local IP address from the phone.

For a deployed version, use HTTPS.

## Important

The PDF is created in the browser using jsPDF. The captured images do not need to be uploaded to the server just to generate the PDF.

## Future upgrades

- Automatic document edge detection
- Perspective correction
- Auto crop
- Image enhancement / grayscale
- OCR to extract text
- Searchable PDFs
- Login and cloud storage
- Drag-and-drop page reordering
- PDF compression
- Firebase/S3 storage
