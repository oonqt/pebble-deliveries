require('pebblejs');
var Settings = require('pebblejs/settings');

Pebble.addEventListener('showConfiguration', function() {
    var data = Settings.data('packages') || [];
    Pebble.openURL('https://ineal.me/pebble/deliveries/configuration?data=' + encodeURIComponent(JSON.stringify({ packages: data })));
});

Pebble.addEventListener('webviewclosed', function(e) {
    if (!e.data) return;

    const packages = JSON.parse(e.data).packages;
    Settings.data('packages', packages);
});