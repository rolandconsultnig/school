const express = require("express");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const routeSync = require("../handlers/routeSync.handler");
const errorHandler = require("../handlers/errorHandler");
const cors = require("cors");

// Initialize the Express application
const app = express();
// Middleware
app.use(express.json());
app.use(morgan("dev")); // Log requests to the console (Express 4)
// Initialize cors 
app.use(cors())
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Module 0 — foundation (tiers, RBAC, audit, multi-tenant)
routeSync(app, "auth");
routeSync(app, "foundation");
routeSync(app, "sis");
routeSync(app, "admissions");
routeSync(app, "parent");
routeSync(app, "pta");
routeSync(app, "attendance");
routeSync(app, "lms");
routeSync(app, "finance");
routeSync(app, "hr");
routeSync(app, "library");
routeSync(app, "idcard");
routeSync(app, "iot");
routeSync(app, "ancillary");
routeSync(app, "analytics");
routeSync(app, "staff");
routeSync(app, "academic");
routeSync(app, "students");

// Define a default route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.get("/api/v1/openapi.yaml", (_req, res) => {
  const specPath = path.join(__dirname, "..", "docs", "openapi.yaml");
  if (!fs.existsSync(specPath)) {
    return res.status(404).json({ status: "failed", message: "OpenAPI spec not found" });
  }
  res.type("text/yaml").send(fs.readFileSync(specPath, "utf8"));
});

app.all("*", (req, res) => {
  res.status(404).json({ status: "failed", message: "Invalid route" });
});

app.use(errorHandler);

module.exports = app;
