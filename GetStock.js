const https = require("https");

const options = {
  method: "GET",
  hostname: "growagarden.gg",
  path: "/stocks?_rsc=14g5d",
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "next-router-state-tree":
      "%5B%22%22%2C%7B%22children%22%3A%5B%22stocks%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fstocks%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2C%22refetch%22%5D",
    priority: "u=1, i",
    referer: "https://growagarden.gg/stocks",
    rsc: "1",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 OPR/119.0.0.0",
    "Content-Length": "0",
  },
};

function extractJSONFromText(text, key) {
  const keyPos = text.indexOf(`"${key}"`);
  if (keyPos === -1) return null;

  const colonPos = text.indexOf(":", keyPos);
  if (colonPos === -1) return null;

  const startPos = text.indexOf("{", colonPos);
  if (startPos === -1) return null;

  let bracketCount = 0;
  let endPos = startPos;

  for (let i = startPos; i < text.length; i++) {
    if (text[i] === "{") bracketCount++;
    else if (text[i] === "}") bracketCount--;

    if (bracketCount === 0) {
      endPos = i;
      break;
    }
  }

  if (bracketCount !== 0) return null;

  return text.slice(startPos, endPos + 1);
}

function fetchStockData() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const jsonString = extractJSONFromText(data, "stockDataSSR");

        if (!jsonString) {
          return reject(new Error("stockDataSSR not found"));
        }

        try {
          const stockDataSSR = JSON.parse(jsonString);
          resolve(stockDataSSR);
        } catch (e) {
          reject(new Error("Failed to parse extracted JSON: " + e.message));
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
}

function register(app) {
  app.get("/api/stock/GetStock", async (req, res) => {
    try {
      const data = await fetchStockData();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch stock data" });
    }
  });
}

module.exports = { register };
