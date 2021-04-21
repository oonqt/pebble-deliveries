require('pebblejs');
var Settings = require('pebblejs/settings');
var UI = require('pebblejs/ui');
var ajax = require('pebblejs/lib/ajax');
var Feature = require('pebblejs/platform/feature');

var strig = require('json-stringify-safe');

var loadingScreen = new UI.Card({
    status: {
        backgroundColor: Feature.color(0x00AAFF, 'white'),
        separator: 'none'
    },
    title: 'Loading...',
});

var errorScreen = new UI.Card({
    status: {
        backgroundColor: Feature.color(0x00AAFF, 'white'),
        separator: 'none'
    },
    title: 'Error!',
    body: 'Something bad happened.. If this continues, please contact the developer.',
});

var packagesMenu = new UI.Menu({
    status: {
        backgroundColor: Feature.color(0x00AAFF, 'white'),
        separator: 'none'
    }, 
    highlightBackgroundColor: Feature.color(0x00AAFF, 'black'),
    highlightTextColor: Feature.color('black', 'white'),
    sections: [{ title: 'Packages', items: [] }]
});

var packageInfo = new UI.Menu({
    status: {
        backgroundColor: Feature.color(0x00AAFF, 'white'),
        separator: 'none'
    }, 
    highlightBackgroundColor: Feature.color(0x00AAFF, 'black'),
    highlightTextColor: Feature.color('black', 'white'),
    sections: [{ title: 'Shipment Info', items: [] }, { title: 'Shipment Progress', items: [] }]
});

var packageInfoCard = new UI.Card({
    status: {
        backgroundColor: Feature.color(0x00AAFF, 'white'),
        separator: 'none'
    }, 
    title: 'Shipment',
    highlightBackgroundColor: Feature.color(0x00AAFF, 'black'),
    highlightTextColor: Feature.color('black', 'white'),
    scrollable: true
});

var packages = Settings.data('packages') || [];
var menuItems = [];

for (var i = 0; i < packages.length; i++) {
    var package = packages[i];

    menuItems.push({
        title: package.itemName,
        subtitle: package.trackingNumber
    });
}

packagesMenu.items(0, menuItems.length ? menuItems : { title: 'No packages', subtitle: 'Add packages via settings' });
packagesMenu.show();

packageInfo.on('select', function(e) {
    if (e.section.title !== 'Shipment Progress') return;

    packageInfoCard.body(e.item.title);
    packageInfoCard.show();
});

packagesMenu.on('select', function(e) {
    loadingScreen.show();

    var trackingId = '';
    var trackingIdSplit = e.item.subtitle.split('');

    for (var i = 0; i < trackingIdSplit.length; i++) {
        trackingId += String.fromCharCode(trackingIdSplit[i].charCodeAt(0) + 18);
    }

    ajax({
        url: 'https://parcelsapp.com/api/v2/parcels',
        method: 'POST',
        type: 'json',
        data: {
            trackingId: trackingId,
            carrier: 'Auto-Detect',
            language: 'en',
            se: 'Pebble/Deliveries'
        }
    }, function(data, status) {
        loadingScreen.hide();

        if (status !== 200 || data.error) {
            console.log(status);
            console.log(JSON.stringify(data));
            errorScreen.show();        
        }

        var packageProgressMarks = [];

        for (var i = 0; i < data.states.length; i++) {
            var state = data.states[i];

            packageProgressMarks.push({
                title: state.status,
                subtitle: 'At: ' + new Date(state.date).toLocaleString()
            });
        }

        packageInfo.items(0, [{ title: 'Status: ' + data.status }]);
        packageInfo.items(1, packageProgressMarks);
        packageInfo.show();
    }, function(err) {
        console.log(err);
        loadingScreen.hide();
        errorScreen.show();
    });
});

Pebble.addEventListener('showConfiguration', function() {
    var data = Settings.data('packages') || [];
    Pebble.openURL('https://oonqt.github.io/pebble-deliveries/config?data=' + encodeURIComponent(JSON.stringify({ packages: data })));
});

Pebble.addEventListener('webviewclosed', function(e) {
    if (!e.data) return;

    const packages = JSON.parse(e.data).packages;
    Settings.data('packages', packages);
});