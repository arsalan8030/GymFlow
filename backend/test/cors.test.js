import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "development";
process.env.FRONTEND_URL = "https://frontend.example";
const { default: app } = await import("../src/app.js");

test("CORS preflight allows local development and configured frontend origins", async t => {
    const server = app.listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    }));

    for (const origin of ["http://localhost:5173", "https://frontend.example"]) {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/owner/login`, {
            method: "OPTIONS",
            headers: {
                Origin: origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        });
        assert.equal(response.status, 204);
        assert.equal(response.headers.get("access-control-allow-origin"), origin);
        assert.equal(response.headers.get("access-control-allow-credentials"), "true");
    }

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/admin/dashboard`, {
        headers: { Origin: "http://localhost:5173" }
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: "Authentication required" });
});
