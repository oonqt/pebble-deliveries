const express = require('express');
const fs = require('fs');
const tls = require('tls');
const path = require('path');
const compression = require('compression');
const { curly } = require('node-libcurl');
const morgan = require('morgan');
const randomstring = require('randomstring');
const { PORT, CHARCODE_OFFSET } = require('./config.json');

// Fix https://github.com/JCMais/node-libcurl/blob/HEAD/COMMON_ISSUES.md#error-ssl-peer-certificate-or-ssh-remote-key-was-not-ok
const certFile = path.join(__dirname, 'cert.pem');
const tlsData = tls.rootCertificates.join('\n');
fs.writeFileSync(certFile, tlsData);

const app = express();
app.use(morgan('dev'));
app.use(compression());

app.get('/api/tracking/:trackingId', async (req, res) => {
    const trackingId = req.params.trackingId.split('').map(s => String.fromCharCode(s.charCodeAt(0) + CHARCODE_OFFSET)).join('');

    try {
        const { statusCode, data, headers } = await curly.post('https://parcelsapp.com/api/v2/parcels', {
            postFields: JSON.stringify({
                trackingId,
                carrier: 'Auto-Detect',
                language: 'en',
                se: randomstring.generate({ length: Math.floor(Math.random() * (100 - 85) + 85) })
            }),
            httpHeader: [
                'Content-Type: application/json',
                'Accept: application/json'
            ],
            caInfo: certFile
        });

        console.log(headers);

        if (statusCode !== 200) return res.status(500).json({ error: 'Failed to fetch tracking information' });
        if (data.error === 'NO_DATA') return res.status(400).json({ error: 'No tracking data for this package found' });
        if (data.states[0].status && data.states[0].status.toLowerCase().indexOf('must contain only capital') !== -1) return res.status(400).json({ error: 'Invalid tracking ID provided' }); 
        if (data.error) throw data;

        const statusMap = {
            'archive': 'Delivered',
            'transit': 'In Transit',
            'pickup': 'Carrier Pickup'
        }

        const transitDuration = data.attributes.find(a => a.l === 'days_transit');
        const remaining = data.eta ? data.eta.remaining : [];

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
