# 🔗 URL2QR MCP Server

[![npm version](https://img.shields.io/npm/v/@xingyuchen/url2qr-mcp.svg)](https://www.npmjs.com/package/@xingyuchen/url2qr-mcp)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)

A powerful MCP (Model Context Protocol) server that converts URLs into QR codes with downloadable links. Built with Express and TypeScript, providing seamless integration with AI assistants like Claude.

## ✨ Features

- 🔗 **URL to QR Code Conversion** - Transform any URL into a scannable QR code
- 📥 **Downloadable Links** - Get HTTP download links for generated QR codes
- ⚙️ **Customizable Options** - Control error correction level and image size
- 🚀 **Streamable HTTP** - Modern MCP transport protocol support
- 🌍 **Remote Service Available** - Use our hosted service at `http://47.79.147.241:3055/mcp`
- 🔌 **Easy Integration** - Works with Claude Desktop and other MCP clients
- 🎨 **Clean API** - RESTful endpoints for health checks and file serving

## 📦 Installation

### Installing via Smithery

To install URL2QR automatically via [Smithery](https://smithery.ai/server/@guangxiangdebizi/url2qr-mcp):

```bash
npx -y @smithery/cli install @guangxiangdebizi/url2qr-mcp
```

### Via npm (Global)

```bash
npm install -g @xingyuchen/url2qr-mcp
```

### Via npm (Local Project)

```bash
npm install @xingyuchen/url2qr-mcp
```

### From Source

```bash
git clone https://github.com/guangxiangdebizi/URL2QR-MCP.git
cd URL2QR-MCP
npm install
npm run build
```

## 🚀 Quick Start

### Option 1: Use Remote Service (Recommended for Quick Testing) 🌍

**No installation needed!** We provide a hosted service for immediate use:

Add to your MCP client configuration (e.g., Claude Desktop's `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "url2qr": {
      "type": "streamableHttp",
      "url": "http://47.79.147.241:3055/mcp",
      "timeout": 600
    }
  }
}
```

✨ **That's it!** You can now use the QR code generation tool without running your own server.

**Tip:** When self-hosting on a public server, remember to set the `PUBLIC_BASE_URL` environment variable so that generated download links use your public domain instead of `localhost`.

### Option 2: Run Your Own Local Server

#### 1. Start the Server

```bash
# If installed globally
url2qr-mcp

# If installed locally or from source
npm start

# For development
npm run dev
```

The server will start on `http://localhost:3000` by default.

#### 2. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop's `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "url2qr": {
      "type": "streamableHttp",
      "url": "http://localhost:3000/mcp",
      "timeout": 600
    }
  }
}
```

### 3. Use the Tool

In Claude Desktop or any MCP-compatible client:

```
Convert https://github.com to a QR code
```

The AI will use the `url_to_qrcode` tool and provide you with a download link!

## 🔧 API Reference

### Tool: `url_to_qrcode`

Converts a URL into a QR code image.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | ✅ Yes | - | The URL to convert into a QR code |
| `errorCorrectionLevel` | string | ❌ No | "M" | Error correction level: "L" (7%), "M" (15%), "Q" (25%), "H" (30%) |
| `width` | number | ❌ No | 300 | Width of the QR code image in pixels |

**Example Response:**

```
✅ QR Code Generated Successfully

Original URL: https://github.com

Download Link: http://localhost:3000/qrcodes/qr-abc123.png

QR Code Details:
- Filename: qr-abc123.png
- Size: 300x300px
- Error Correction: M
```

## 🌐 HTTP Endpoints

### `GET /`
API information and documentation.

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "transport": "streamable-http",
  "activeSessions": 2,
  "serverName": "URL2QR-MCP",
  "version": "1.0.0"
}
```

### `POST /mcp`
MCP protocol endpoint (JSON-RPC).

### `GET /qrcodes/:filename`
Download generated QR code images.

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
PORT=3000
QR_OUTPUT_DIR=./qrcodes
# PUBLIC_BASE_URL is optional - auto-detected from request headers by default
PUBLIC_BASE_URL=http://localhost:3000
```

**Environment Variables:**

- `PORT` - Server port (default: 3000)
- `QR_OUTPUT_DIR` - Directory for storing QR code images (default: ./qrcodes)
- `PUBLIC_BASE_URL` - **Optional**. External base URL for download links. If not set, the server automatically detects the URL from incoming request headers (supports reverse proxies with `X-Forwarded-Host` and `X-Forwarded-Proto`)

### 🎯 Auto-Detection Feature

The server **automatically detects its public URL** from incoming HTTP requests, so you don't need to configure `PUBLIC_BASE_URL` in most cases:

- ✅ **Smithery/Cloud Deployments**: Automatically uses the correct public domain
- ✅ **Behind Reverse Proxy**: Reads `X-Forwarded-Host` and `X-Forwarded-Proto` headers
- ✅ **Local Development**: Falls back to `localhost:PORT`

Only set `PUBLIC_BASE_URL` if you need to override the auto-detected value.

## 🏗️ Project Structure

```
URL2QR-MCP/
├── src/
│   ├── index.ts              # MCP server entry point
│   └── tools/
│       └── url2qr.ts         # QR code generation tool
├── qrcodes/                  # Generated QR codes (auto-created)
├── build/                    # Compiled JavaScript (auto-generated)
├── package.json
├── tsconfig.json
├── .env                      # Configuration
└── README.md
```

## 🔒 Session Management

The server implements automatic session cleanup:
- Sessions expire after 30 minutes of inactivity
- Cleanup runs every 15 minutes
- Session IDs are managed via `Mcp-Session-Id` headers

## 🌐 Deployment Options

### Remote Service (Production)

We provide a hosted service at:
- **Endpoint**: `http://47.79.147.241:3055/mcp`
- **Health Check**: `http://47.79.147.241:3055/health`
- **Status**: 🟢 Online and ready to use

This is perfect for:
- Quick testing without setup
- Production use without infrastructure
- Teams sharing a single endpoint

### Local Deployment

Run your own instance for:
- Development and testing
- Private/isolated environments
- Custom configurations
- On-premise requirements

The server automatically detects its public URL from request headers, so it works seamlessly behind reverse proxies and in cloud environments without manual configuration.

### Deploy on Smithery (Managed Hosting)

You can deploy URL2QR MCP server to [Smithery](https://smithery.ai) for managed hosting:

1. Ensure the repository contains `Dockerfile` and `smithery.yaml` (already included)
2. Install the Smithery CLI locally:
   ```bash
   npm install
   npx smithery build
   ```
3. Push your code to GitHub and connect the repo in Smithery dashboard
4. Configure environment variables in Smithery (optional):
   - `PORT=3000`
   - `QR_OUTPUT_DIR=/app/qrcodes`
   - `PUBLIC_BASE_URL` - **Not required** (auto-detected from requests)
5. Trigger a deployment from Smithery UI

✨ **No manual URL configuration needed!** The server automatically detects Smithery's public URL from request headers.

Refer to Smithery docs for more details: [TypeScript Deployments](https://smithery.ai/docs/build/deployments/typescript), [Project Configuration](https://smithery.ai/docs/build/project-config)

## 📝 Examples

### Basic Usage

```javascript
// Tool parameters
{
  "url": "https://example.com"
}
```

### Custom Error Correction

```javascript
{
  "url": "https://example.com",
  "errorCorrectionLevel": "H"  // High error correction (30%)
}
```

### Custom Size

```javascript
{
  "url": "https://example.com",
  "width": 500  // 500x500 pixels
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Xingyu Chen**

- GitHub: [@guangxiangdebizi](https://github.com/guangxiangdebizi)
- LinkedIn: [Xingyu Chen](https://www.linkedin.com/in/xingyu-chen-b5b3b0313/)
- npm: [@xingyuchen](https://www.npmjs.com/~xingyuchen)
- Email: guangxiangdebizi@gmail.com

## 🙏 Acknowledgments

- Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- QR code generation powered by [qrcode](https://www.npmjs.com/package/qrcode)
- Express.js for HTTP server

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/desktop)

---

⭐ If you find this project useful, please consider giving it a star on GitHub!
