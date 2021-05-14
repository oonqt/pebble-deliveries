require('pebblejs');
var Settings = require('pebblejs/settings');
var UI = require('pebblejs/ui');
var ajax = require('pebblejs/lib/ajax');
var Feature = require('pebblejs/platform/feature');

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
    title: 'Error!'
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

function showError(msg) {
    errorScreen.body(msg);
    errorScreen.show();
}

function updatePackagesMenu(packages) {
    var menuItems = [];

    for (var i = 0; i < packages.length; i++) {
        var package = packages[i];

        menuItems.push({
            title: package.itemName,
            subtitle: package.trackingNumber
        });
    }

    packagesMenu.items(0, menuItems.length ? menuItems : [{ title: 'No packages', subtitle: 'Add packages via settings' }]); // if no items display message
}

var packages = Settings.data('packages') || [];
updatePackagesMenu(packages);
packagesMenu.show();

packageInfo.on('select', function(e) {
    if (e.section.title !== 'Shipment Progress') return;

    packageInfoCard.body(e.item.title);
    packageInfoCard.show();
});

packagesMenu.on('select', function(e) {
    if (e.item.title === 'No packages') return;

    loadingScreen.show();

    var trackingId = e.item.subtitle;

    ajax({
        url: 'https://deliveries.memester.xyz/api/tracking/' + trackingId,
        type: 'json',
    }, function(data, status) {
        loadingScreen.hide();

        if (data.error === 'NO_DATA') {
            return showError('No tracking data for this package found');
        } else if (data.states[0].status && data.states[0].status.toLowerCase().indexOf('must contain only capital') !== -1) {
            return showError('Invalid tracking number/ID');
        } else if (status !== 200 || data.error) {
            console.log(status);
            console.log(JSON.stringify(data));
            showError('Something went wrong, try contacting a developer.');
            return;        
        }

        var packageProgressMarks = [];

        for (var i = 0; i < data.states.length; i++) {
            var state = data.states[i];
            
            /* ok this is a very sped way of doing this but
             api doesnt return that it is utc+10 so Date object tries to localize the date into correct timezone
             when it is already correct */
            var at = state.date.split('T');;
            var date = at[0].split('-');
            var time = at[1].split(':');

            var hour = parseInt(time[0]);

            packageProgressMarks.push({
                title: state.status,
                subtitle: 'At: ' + (date[1] - 0) /* remove trailing zeros */ + '/' + date[2] + ', ' + (hour >= 12 ? hour - 12 : hour) + ':' + time[1] + (hour >= 12 ? ' PM' : ' AM')
            });
        }

        var meta = [{ title: 'Status: ', subtitle: data.status }];
        if (data.daysInTransit) {
            meta.push({ title: 'Days in Transit: ', subtitle: data.daysInTransit });
        }
        if (data.minRemaining) { // I'm not 100% sure that ETA will always exist.. Would be nice if I had some other packages.. Better safe than sorry I guess, could remove in the future
            meta.push({
                title: 'ETA:',
                subtitle: data.minRemaining + ' - ' + data.maxRemaining + ' Days'
            });
        }

        packageInfo.items(0, meta);
        packageInfo.items(1, packageProgressMarks);
        packageInfo.show();
    }, function(err) {
        console.log(err);
        loadingScreen.hide();
        showError('Something went wrong. Try checking your network connection.')
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
    updatePackagesMenu(packages);
});