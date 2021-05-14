const express = require('express');
const axios = require('axios');
const randomstring = require('randomstring');
const { PORT, CHARCODE_OFFSET } = require('./config.json');

const app = express();

app.get('/api/tracking/:trackingId', async (req, res) => {
    const trackingId = req.params.trackingId.split('').map(s => String.fromCharCode(s.charCodeAt(0) + CHARCODE_OFFSET)).join('');

    try {
        const { data } = await axios.post('https://parcelsapp.com/api/v2/parcels', {
            trackingId,
            carrier: 'Auto-Detect',
            language: 'en',
            se: randomstring.generate({ length: Math.floor(Math.random() * (100 - 85) + 85) })
        });

        res.json(data);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => console.log('Listening on:', PORT));