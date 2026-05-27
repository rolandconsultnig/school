const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const app = require("../app/app");

let server;
let baseUrl;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let json = {};
          try {
            json = JSON.parse(data || "{}");
          } catch {
            json = { raw: data };
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

before(async () => {
  if (!process.env.DATABASE_URL) return;
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("GET / returns running message", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const url = new URL("/", baseUrl);
  const text = await new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      })
      .on("error", reject);
  });
  assert.equal(text.status, 200);
  assert.match(text.data, /running/i);
});

test("POST /api/v1/auth/login rejects bad password", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const { status, json } = await request("POST", "/api/v1/auth/login", {
    email: "superadmin@school.local",
    password: "wrong-password",
  });
  assert.equal(status, 401);
  assert.equal(json.status, "failed");
});

test("POST /api/v1/auth/login succeeds for seed superadmin", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const { status, json } = await request("POST", "/api/v1/auth/login", {
    email: "superadmin@school.local",
    password: "SuperAdmin@123",
  });
  assert.equal(status, 200);
  assert.equal(json.status, "success");
  assert.ok(json.data?.token);
  assert.ok(json.data?.profileType);
});

test("GET /api/v1/openapi.yaml serves spec", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const url = new URL("/api/v1/openapi.yaml", baseUrl);
  const yaml = await new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      })
      .on("error", reject);
  });
  assert.equal(yaml.status, 200);
  assert.match(yaml.data, /openapi:/);
});

test("GET /api/v1/exams requires authentication", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const { status } = await request("GET", "/api/v1/exams");
  assert.ok(status === 401 || status === 403);
});

test("GET /api/v1/exams succeeds for superadmin token", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const login = await request("POST", "/api/v1/auth/login", {
    email: "superadmin@school.local",
    password: "SuperAdmin@123",
  });
  const token = login.json.data?.token;
  assert.ok(token);
  const { status, json } = await request("GET", "/api/v1/exams", null, {
    Authorization: `Bearer ${token}`,
  });
  assert.equal(status, 200);
  assert.equal(json.status, "success");
  assert.ok(Array.isArray(json.data));
});

test("GET /api/v1/finance/fee-structures forbidden for student", async (t) => {
  if (!process.env.DATABASE_URL) return t.skip("DATABASE_URL not set");
  const login = await request("POST", "/api/v1/auth/login", {
    email: "student@school.local",
    password: "Student@123",
  });
  const token = login.json.data?.token;
  if (!token) return t.skip("student seed login unavailable");
  const { status } = await request("GET", "/api/v1/finance/fee-structures", null, {
    Authorization: `Bearer ${token}`,
  });
  assert.ok(status === 403 || status === 401);
});
