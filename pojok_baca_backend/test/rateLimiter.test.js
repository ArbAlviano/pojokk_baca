const test = require('node:test');
const assert = require('node:assert');
const { loginRateLimiter, resetLoginAttempts } = require('../lib/rateLimiter');

function runLogin(ip) {
    const req = { ip };
    const res = {
        status(code) { this.code = code; return this; },
        json(obj) { this.body = obj; }
    };
    let passed = false;
    loginRateLimiter(req, res, () => { passed = true; });
    return { code: res.code, body: res.body, passed };
}

function simulateCycle(ip) {
    const results = [];
    for (let i = 0; i < 5; i++) {
        results.push(runLogin(ip));
    }
    return results;
}

test('cycle 1: 5 fails blocks for 15 minutes (900s)', () => {
    resetLoginAttempts('ip1');
    const results = simulateCycle('ip1');
    // First 4 pass to handler, 5th blocked
    assert.strictEqual(results[0].passed, true);
    assert.strictEqual(results[3].passed, true);
    assert.strictEqual(results[4].code, 429);
    assert.strictEqual(results[4].body.retryAfter, 900);
});

test('after unblock, cycle 2 blocks for 30 minutes (1800s)', () => {
    resetLoginAttempts('ip2');
    simulateCycle('ip2');
    // Manually expire the block to simulate 15 min passing
    const blocks = require('../lib/rateLimiter').blocks;
    const data = blocks.get('ip2');
    data.blockedUntil = Date.now() - 1;
    const results = simulateCycle('ip2');
    assert.strictEqual(results[4].code, 429);
    assert.strictEqual(results[4].body.retryAfter, 1800);
});

test('cycle 3 blocks for 120 minutes (7200s) and stays cap', () => {
    resetLoginAttempts('ip3');
    const blocks = require('../lib/rateLimiter').blocks;
    simulateCycle('ip3');
    blocks.get('ip3').blockedUntil = Date.now() - 1;
    simulateCycle('ip3');
    blocks.get('ip3').blockedUntil = Date.now() - 1;
    const results = simulateCycle('ip3');
    assert.strictEqual(results[4].code, 429);
    assert.strictEqual(results[4].body.retryAfter, 7200);
});
