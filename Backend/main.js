const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("Application/src"));

// Nature Rune cost (in GP)
const NATURE_RUNE_COST = 100;

// Convert UNIX timestamp to AEST formatted date
const convertToAEST = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }); // Format to DD/MM/YYYY
};

// Fetch OSRS Grand Exchange items with names
app.get('/fetch-items', async (req, res) => {
    console.log("/fetch-items hit");
    
    try {
        // Fetch the item mapping for item names
        const mappingResponse = await axios.get('https://prices.runescape.wiki/api/v1/osrs/mapping', {
            headers: {
                'User-Agent': 'OSRS-GE-Tracker/1.0 (Acc: yeahlolnice)',
            },
        });
        const itemMapping = mappingResponse.data;

        // Fetch the latest price data
        const priceResponse = await axios.get('https://prices.runescape.wiki/api/v1/osrs/latest', {
            headers: {
                'User-Agent': 'OSRS-GE-Tracker/1.0 (Acc: yeahlolnice)',
            },
        });
        const prices = priceResponse.data.data;

        // Cross-reference price data with item names
        const items = Object.entries(prices).map(([id, details]) => {
            const itemDetails = itemMapping.find((item) => item.id === parseInt(id, 10)) || {};
            const name = itemDetails.name || 'Unknown';
            const description = itemDetails.examine || 'Unknown';
            const membersStatus = itemDetails.members || false;
            const lowAlchPrice = itemDetails.lowalch || 0;
            const highAlchPrice = Math.floor(itemDetails.highalch || 0); // High Alch value
            const gePrice = details.high || details.low || 0; // Prefer high price, fallback to low
            const lowTime = details.lowTime ? convertToAEST(details.lowTime) : 'Unknown';
            const highTime = details.highTime ? convertToAEST(details.highTime) : 'Unknown';
            const iconName = itemDetails.icon || '';
            const iconLocation = "https://oldschool.runescape.wiki/images/";
            const itemIconName = iconName.includes(" ") ? iconName.replace(/\s/g, "_") : iconName;
            const iconURL = `${iconLocation}${itemIconName}`;
            const profit = highAlchPrice - gePrice - NATURE_RUNE_COST;
            const geLimt = itemDetails.limt || 0;

            return {
                id,
                name,
                description,
                membersStatus,
                gePrice,
                lowAlchPrice,
                highAlchPrice,
                profit,
                lowTime,
                highTime,
                iconURL,
                profit,
                geLimt,
            };
        });

        // Filter items with profit >= 500 GP
        const filteredItems = items.filter((item) => item.profit >= 300);

        res.json(filteredItems);
    } catch (error) {
        console.error('Error fetching GE data:', error.message);
        res.status(500).send('Failed to fetch items');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});