const blocks = new Map();

const DURATIONS = [15, 30, 120];
const MAX_ATTEMPTS = 5;
const IDLE_RESET_MS = 24 * 60 * 60 * 1000;

function cleanup() {
    const now = Date.now();
    for (const [ip, data] of blocks) {
        if (now - data.lastAttempt > 60 * 60 * 1000) {
            blocks.delete(ip);
        }
    }
}
setInterval(cleanup, 10 * 60 * 1000);

function loginRateLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    let data = blocks.get(ip);

    if (!data) {
        data = { attempts: 0, blockLevel: 0, blockedUntil: null, lastAttempt: now };
        blocks.set(ip, data);
    }

    if (now - data.lastAttempt > IDLE_RESET_MS) {
        data.attempts = 0;
        data.blockLevel = 0;
        data.blockedUntil = null;
    }
    data.lastAttempt = now;

    if (data.blockedUntil && now < data.blockedUntil) {
        const retryAfter = Math.ceil((data.blockedUntil - now) / 1000);
        return res.status(429).json({
            message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${retryAfter} detik.`,
            retryAfter
        });
    }

    if (data.blockedUntil && now >= data.blockedUntil) {
        data.attempts = 0;
        data.blockedUntil = null;
    }

    data.attempts++;

    if (data.attempts >= MAX_ATTEMPTS) {
        const duration = DURATIONS[Math.min(data.blockLevel, DURATIONS.length - 1)];
        data.blockedUntil = now + duration * 60 * 1000;

        if (data.blockLevel < DURATIONS.length - 1) {
            data.blockLevel++;
        }

        const retryAfter = Math.ceil((data.blockedUntil - now) / 1000);
        return res.status(429).json({
            message: `Terlalu banyak percobaan gagal. Coba lagi dalam ${retryAfter} detik.`,
            retryAfter
        });
    }

    next();
}

function resetLoginAttempts(ip) {
    blocks.delete(ip);
}

module.exports = { loginRateLimiter, resetLoginAttempts, blocks };
