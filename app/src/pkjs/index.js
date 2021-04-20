require('pebblejs');
var Settings = require('pebblejs/settings')
var Clay = require('./clay');
var clayConfig = require('./config');
var clay = new Clay(clayConfig, customClay, { autoHandleEvents: false });

function customClay(min) {
    console.log(JSON.stringify(this));
    console.log(JSON.stringify(min));
}

Pebble.addEventListener('showConfiguration', function(e) {
    Pebble.openURL(clay.generateUrl());
});

Pebble.addEventListener('webviewclosed', function(e) {
    console.log(JSON.stringify(e.response));

    if (e && !e.response) return;

    Settings.option(clay.getSettings(e.response));
});