// Simple Express server to serve the Angular app
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Check if build directory exists
const distPath = path.join(__dirname, "dist/neural-network-frontend/browser");

if (!isProduction) {
  console.log("Checking for dist directory at:", distPath);
}

if (!fs.existsSync(distPath)) {
  console.error(
    "ERROR: dist/neural-network-frontend/browser directory not found!",
  );
  console.error(
    "Make sure to run 'npm run build:prod' before starting the server",
  );
  process.exit(1);
}

// Add basic middleware for logging (only in development)
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  if (!isProduction) {
    console.log("Health check requested");
  }
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "neural-network-frontend",
    port: port,
  });
});

// Serve static files from the Angular app build directory
// Cache JS/CSS/assets for 1 year (they have content hashes)
// But never cache HTML files
app.use(
  express.static(path.join(__dirname, "dist/neural-network-frontend/browser"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        // Never cache HTML files
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else if (
        filePath.endsWith(".js") ||
        filePath.endsWith(".css") ||
        filePath.match(/\.(woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)
      ) {
        // Cache fingerprinted assets for 1 year
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// Handle Angular routing - return all requests to Angular index.html
app.get("*", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(
    path.join(__dirname, "dist/neural-network-frontend/browser/index.html"),
  );
});

app
  .listen(port, "0.0.0.0", () => {
    console.log(`Neural Network Frontend running on port ${port}`);
    console.log(`Health check available at: http://0.0.0.0:${port}/health`);
  })
  .on("error", (err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });
