import test from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

test("session probe returns an unauthenticated result without an error status", async t => {
    const server = app.listen(0);
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
    }));

    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/auth/session`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.user, null);
});
