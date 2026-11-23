import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import app from "../src/app.js";

test("health endpoints report an unavailable database instead of healthy", async t => {
    await mongoose.disconnect();
    const server = app.listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    }));

    for (const path of ["/", "/api/v1/health"]) {
        const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
        const body = await response.json();
        assert.equal(response.status, 503);
        assert.equal(body.database, "disconnected");
        assert.equal(body.success, false);
    }
});
