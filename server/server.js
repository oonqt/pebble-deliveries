const express = require('express');
const compression = require('compression');
const axios = require('axios');
const morgan = require('morgan');
const randomstring = require('randomstring');
const { PORT, CHARCODE_OFFSET } = require('./config.json');

const app = express();
app.use(morgan('dev'));
app.use(compression());

app.get('/api/tracking/:trackingId', async (req, res) => {
    const trackingId = req.params.trackingId.split('').map(s => String.fromCharCode(s.charCodeAt(0) + CHARCODE_OFFSET)).join('');

    try {
        const { data } = await axios.post('https://parcelsapp.com/api/v2/parcels', {
            trackingId,
            carrier: 'Auto-Detect',
            language: 'en',
            se: randomstring.generate({ length: Math.floor(Math.random() * (100 - 85) + 85) })
        });

        if (data.error === 'NO_DATA') return res.status(400).json({ error: 'No tracking data for this package found' });
        if (data.states[0].status && data.states[0].status.toLowerCase().indexOf('must contain only capital') !== -1) return res.status(400).json({ error: 'Invalid tracking ID provided' }); 
        if (data.error) throw data;

        const statusMap = {
            'archive': 'Delivered',
            'transit': 'In Transit'
        }

        const transitDuration = data.attributes.find(a => a.l === 'days_transit');
        const remaining = data.eta.remaining;

        res.json({
            minRemaining: remaining[0] ?? null,
            maxRemaining: remaining[1] ?? null,
            daysInTransit: transitDuration && transitDuration.val ? parseInt(transitDuration.val) : null,
            status: statusMap[data.status] ?? data.status,
            states: data.states
        });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.listen(PORT, () => console.log('Listening on:', PORT));