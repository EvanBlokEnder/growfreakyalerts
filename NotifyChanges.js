const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { register: registerItemInfo, fetchAndUpdateData } = require('./GrabItemInfo');
const { register: registerWeather, fetchWeather } = require('./GrabWeather');
const { register: registerStock, fetchStockData } = require('./GetStock');
const { register: registerRestock, calculateRestockTimes } = require('./GetRestockTime');

const DATA_FILE = path.join(__dirname, 'Database.json');
const PREV_DATA_FILE = path.join(__dirname, 'PreviousData.json');

// Email configuration (using Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
    }
});

// Load previous data
let previousData = { stock: null, weather: null, restock: null, items: null };
if (fs.existsSync(PREV_DATA_FILE)) {
    try {
        previousData = JSON.parse(fs.readFileSync(PREV_DATA_FILE, 'utf-8'));
    } catch (err) {
        console.error(`[NotifyChanges] Error loading previous data: ${err}`);
    }
}

// Function to send email
async function sendEmail(subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.RECIPIENT_EMAIL, // Your recipient email (same as EMAIL_USER)
        subject: subject,
        text: text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[NotifyChanges] Email sent: ${subject}`);
    } catch (err) {
        console.error(`[NotifyChanges] Error sending email: ${err}`);
    }
}

// Function to compare and notify changes
async function checkForChanges() {
    try {
        // Fetch stock data
        const stockData = await fetchStockData();
        if (JSON.stringify(stockData) !== JSON.stringify(previousData.stock)) {
            await sendEmail(
                'Grow a Garden: Stock Data Updated',
                `Stock data has changed:\n${JSON.stringify(stockData, null, 2)}`
            );
            previousData.stock = stockData;
        }

        // Fetch weather data
        await new Promise((resolve, reject) => {
            fetchWeather((err, result) => {
                if (err) {
                    console.error(`[NotifyChanges] Error fetching weather: ${err}`);
                    return resolve(); // Continue even if weather fetch fails
                }
                if (JSON.stringify(result) !== JSON.stringify(previousData.weather)) {
                    sendEmail(
                        'Grow a Garden: Weather Data Updated',
                        `Weather data has changed:\n${JSON.stringify(result, null, 2)}`
                    );
                    previousData.weather = result;
                }
                resolve();
            });
        });

        // Check restock times
        const restockData = calculateRestockTimes();
        const restockTypes = ['egg', 'gear', 'seeds', 'cosmetic', 'SwarmEvent'];
        for (const type of restockTypes) {
            if (previousData.restock && previousData.restock[type]) {
                if (restockData[type].LastRestock !== previousData.restock[type].LastRestock) {
                    await sendEmail(
                        `Grow a Garden: ${type} Restock Occurred`,
                        `${type} restock occurred at ${restockData[type].LastRestock}.\nNext restock: ${restockData[type].countdown}`
                    );
                }
            }
        }
        previousData.restock = restockData;

        // Check item info
        await fetchAndUpdateData();
        let newItemData = null;
        if (fs.existsSync(DATA_FILE)) {
            newItemData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
        if (JSON.stringify(newItemData) !== JSON.stringify(previousData.items)) {
            await sendEmail(
                'Grow a Garden: Item Data Updated',
                `Item data has changed:\n${JSON.stringify(newItemData, null, 2)}`
            );
            previousData.items = newItemData;
        }

        // Save updated previous data
        try {
            fs.writeFileSync(PREV_DATA_FILE, JSON.stringify(previousData, null, 2));
        } catch (err) {
            console.error(`[NotifyChanges] Error saving previous data: ${err}`);
        }
    } catch (err) {
        console.error(`[NotifyChanges] Error checking for changes: ${err}`);
    }
}

// Run checks every 5 minutes
setInterval(checkForChanges, 5 * 60 * 1000);

// Initial check
checkForChanges();

// Express app setup
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.json({ message: 'Grow a Garden Notifier is running' });
});

registerItemInfo(app);
registerWeather(app);
registerStock(app);
registerRestock(app);

app.get('/api/force-check', async (req, res) => {
    await checkForChanges();
    res.json({ message: 'Change check triggered' });
});

// Log all registered routes
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(`[Routes] ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                console.log(`[Routes] ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[NotifyChanges] Server running on port ${PORT}`);
});
