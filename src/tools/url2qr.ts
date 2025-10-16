import QRCode from "qrcode";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const url2qr = {
  name: "url_to_qrcode",
  description: "Convert a URL into a QR code image and return the download link. The QR code will be saved as a PNG file and accessible via HTTP.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to convert into a QR code (e.g., https://example.com)"
      },
      errorCorrectionLevel: {
        type: "string",
        enum: ["L", "M", "Q", "H"],
        description: "QR code error correction level. L=Low(7%), M=Medium(15%), Q=Quartile(25%), H=High(30%). Default: M"
      },
      width: {
        type: "number",
        description: "Width of the QR code image in pixels. Default: 300"
      }
    },
    required: ["url"]
  },

  async run(
    args: { url: string; errorCorrectionLevel?: "L" | "M" | "Q" | "H"; width?: number },
    context?: { hostBaseUrl?: string }
  ) {
    try {
      // 1️⃣ Parameter validation
      if (!args.url) {
        throw new Error("URL parameter is required");
      }

      // Validate URL format
      try {
        new URL(args.url);
      } catch (e) {
        throw new Error(`Invalid URL format: ${args.url}`);
      }

      // 2️⃣ Set default values
      const errorCorrectionLevel = args.errorCorrectionLevel || "M";
      const width = args.width || 300;

      // 3️⃣ Generate QR code
      const qrOutputDir = process.env.QR_OUTPUT_DIR || "./qrcodes";
      
      // Ensure output directory exists
      await fs.mkdir(qrOutputDir, { recursive: true });

      // Generate unique filename
      const filename = `qr-${randomUUID()}.png`;
      const filePath = path.join(qrOutputDir, filename);

      // Generate QR code with options
      await QRCode.toFile(filePath, args.url, {
        errorCorrectionLevel,
        width,
        type: "png",
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });

      // 4️⃣ Build download URL - Auto-detect from request or use environment variable
      // Priority: 1) Request host (dynamic) 2) Environment variable 3) Localhost fallback
      const port = process.env.PORT || 3000;
      let downloadBaseUrl: string;
      
      if (context?.hostBaseUrl) {
        // Use dynamically detected host from request
        downloadBaseUrl = context.hostBaseUrl.replace(/\/$/, "");
      } else if (process.env.PUBLIC_BASE_URL) {
        // Use configured public URL
        downloadBaseUrl = process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
      } else {
        // Fallback to localhost
        downloadBaseUrl = `http://localhost:${port}`;
      }
      
      const downloadUrl = `${downloadBaseUrl}/qrcodes/${filename}`;

      // 5️⃣ Format return
      return {
        content: [{
          type: "text" as const,
          text: `# ✅ QR Code Generated Successfully

**Original URL:** ${args.url}

**Download Link:** ${downloadUrl}

**QR Code Details:**
- Filename: ${filename}
- Size: ${width}x${width}px
- Error Correction: ${errorCorrectionLevel}

You can download the QR code image from the link above.`
        }]
      };

    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ Failed to generate QR code: ${error.message}`
        }],
        isError: true
      };
    }
  }
};

