module.exports = [
    {
        type: 'heading',
        defaultValue: 'Pebble Deliveries'
    },
    {
        type: 'section',
        items: [
            {
                type: 'input',
                appKey: 'deliveryName',
                label: 'Delivery Name'
            },
            {
                type: 'input',
                appKey: 'trackingNumber',
                label: 'Tracking Number'
            },
            {
                type: 'button',
                primary: false,
                defaultValue: 'Delete Delivery'
            }
        ]
    },
    {
        type: 'submit',
        defaultValue: 'Save'
    }
];