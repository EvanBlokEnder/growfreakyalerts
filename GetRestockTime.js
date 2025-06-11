function pad(n) {
  return n < 10 ? '0' + n : n;
}

function calculateRestockTimes() {
  const now = new Date();
  const timezone = 'America/New_York'; // or use Intl.DateTimeFormat().resolvedOptions().timeZone if preferred
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  }

  function timeSince(timestamp) {
    const nowMs = Date.now();
    const diff = nowMs - timestamp;

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  function getResetTimes(interval) {
    const timeSinceStartOfDay = now.getTime() - today.getTime();
    const lastReset = today.getTime() + Math.floor(timeSinceStartOfDay / interval) * interval;
    const nextReset = today.getTime() + Math.ceil(timeSinceStartOfDay / interval) * interval;
    return { lastReset, nextReset };
  }

  const eggInterval = 30 * 60 * 1000;
  const { lastReset: eggLastReset, nextReset: eggNextReset } = getResetTimes(eggInterval);
  const eggCountdownMs = eggNextReset - now.getTime();
  const eggCountdown = `${pad(Math.floor(eggCountdownMs / 3.6e6))}h ${pad(Math.floor((eggCountdownMs % 3.6e6) / 6e4))}m ${pad(Math.floor((eggCountdownMs % 6e4) / 1000))}s`;

  const gearInterval = 5 * 60 * 1000;
  const { lastReset: gearLastReset, nextReset: gearNextReset } = getResetTimes(gearInterval);
  const gearCountdownMs = gearNextReset - now.getTime();
  const gearCountdown = `${pad(Math.floor(gearCountdownMs / 6e4))}m ${pad(Math.floor((gearCountdownMs % 6e4) / 1000))}s`;

  const cosmeticInterval = 4 * 3600 * 1000;
  const { lastReset: cosmeticLastReset, nextReset: cosmeticNextReset } = getResetTimes(cosmeticInterval);
  const cosmeticCountdownMs = cosmeticNextReset - now.getTime();
  const cosmeticCountdown = `${pad(Math.floor(cosmeticCountdownMs / 3.6e6))}h ${pad(Math.floor((cosmeticCountdownMs % 3.6e6) / 6e4))}m ${pad(Math.floor((cosmeticCountdownMs % 6e4) / 1000))}s`;

  const nightInterval = 3600 * 1000;
  const { lastReset: nightLastReset, nextReset: nightNextReset } = getResetTimes(nightInterval);
  const nightCountdownMs = nightNextReset - now.getTime();
  const nightCountdown = `${pad(Math.floor(nightCountdownMs / 3.6e6))}h ${pad(Math.floor((nightCountdownMs % 3.6e6) / 6e4))}m ${pad(Math.floor((nightCountdownMs % 6e4) / 1000))}s`;

  return {
    egg: {
      timestamp: eggNextReset,
      countdown: eggCountdown,
      LastRestock: formatTime(eggLastReset),
      timeSinceLastRestock: timeSince(eggLastReset)
    },
    gear: {
      timestamp: gearNextReset,
      countdown: gearCountdown,
      LastRestock: formatTime(gearLastReset),
      timeSinceLastRestock: timeSince(gearLastReset)
    },
    seeds: {
      timestamp: gearNextReset,
      countdown: gearCountdown,
      LastRestock: formatTime(gearLastReset),
      timeSinceLastRestock: timeSince(gearLastReset)
    },
    cosmetic: {
      timestamp: cosmeticNextReset,
      countdown: cosmeticCountdown,
      LastRestock: formatTime(cosmeticLastReset),
      timeSinceLastRestock: timeSince(cosmeticLastReset)
    },
    SwarmEvent: {
      timestamp: nightNextReset,
      countdown: nightCountdown,
      LastRestock: formatTime(nightLastReset),
      timeSinceLastRestock: timeSince(nightLastReset)
    }
  };
}

function register(app) {
  app.get('/api/stock/restock-time', (req, res) => {
    const restockTimes = calculateRestockTimes();
    res.json(restockTimes);
  });
}

module.exports = { register };

