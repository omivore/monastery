// background.js

var timeRemaining;  // Seconds left on the hourglass
var hourglass = null;
var passedDelay = [];

function gatekeeper(event) {
    browser.storage.sync.get(['hourglass', 'delays', 'delayOn']).then(result => {
        if (result.hourglass != 0) {    // Permitted Stage
            isTresspassing().then(tresspass => {
                if (tresspass) {
                    // If delay is on, go through delay phase before timer
                    if (result.delayOn) {
                        delay(result.delays);
                    }

                    // Otherwise, start or continue timer
                    if (!hourglass) hourglass = setInterval(sandTick, 1000);
                } else {
                    // Stop timer and update hourglass
                    clearInterval(hourglass);
                    hourglass = null;
                    browser.storage.sync.set({hourglass: timeRemaining});
                }
            });
        } else {                        // Blocking Stage
            isTresspassing().then(tresspass => {
                if (tresspass) {
                    // Redirect tab to blocking page
                    blockAll();
                }
            });
        }
    });
}

function isTresspassing() {
    return getTresspassing(result => {
        // If result is not empty, then is tresspassing.
        if (result.length > 0) {
            // If tresspassing, then show so in the extension icon.
            browser.browserAction.setIcon({
                    path: { 48: 'icons/monastery_lock.svg'},
            });
            return true;
        } else {
            // If not tresspassing, make sure icon is back to normal.
            browser.browserAction.setIcon({
                    path: { 48: 'icons/monastery.svg'},
            });
            return false;
        }
    });
}

function sandTick() {
    // Decrement timeRemaining.
    timeRemaining -= 1;

    // Update the status panel.
    browser.runtime.sendMessage({'timeRemaining': timeRemaining})
        .catch(error => { });   // If there's an error, the popup ain't open.

    // Check if notifications need to be sent out, and send them if so.
    browser.storage.sync.get('notifications').then(result => {
        var message = '';
        for (let time of result.notifications) {
            if (timeRemaining == time * 60) {
                message = `You have ${time} ${(time > 1) ? 'minutes' : 'minute'} left!`;
                break;
            }
        }
        if (message.length > 0) {
            browser.notifications.create({
                'type': 'basic',
                'iconUrl': browser.extension.getURL('icons/monastery.svg'),
                'title': 'Monastery Notice',
                'message': message
            });
        }
    });

    // Check if time is up, in which case redirect all tresspassers.
    if (timeRemaining <= 0) {
        browser.storage.sync.set({hourglass: 0});
        clearInterval(hourglass);
        timeRemaining = 0;
        blockAll();
    }
}
// Occasionally update the hourglass so that the popup 'jumps' less of a
// distance on opening. Update every arbitrary five seconds.
setInterval(() => browser.storage.sync.set({hourglass: timeRemaining}), 5000);

function blockAll() {
    getTresspassing(result => {
        for (let tab of result) {
            browser.tabs.update(
                tab.id,
                {url: browser.extension.getURL('pages/block_page.html')}
            );
        }
    });
}

function delay(delayTime) {
    getTresspassing(result => {
        for (let tab of result) {
            // Let through all who went through this trial already
            if (passedDelay.includes(tab.id)) {
                if (!hourglass) hourglass = setInterval(sandTick, 1000);
                return;
            }

            // Otherwise subject them to the trial!
            let destination = tab.url;
            browser.tabs.update(tab.id, {
                url: "/pages/delay_page.html"
            }).then(() => {
                browser.tabs.onUpdated.addListener(function delayListen(tabId, changeInfo, tab) {
                    if (tabId == tab.id &&
                        changeInfo.hasOwnProperty('status') &&
                        changeInfo.status == "complete") {
                        browser.tabs.executeScript(tab.id, {
                            code: `initialize(${delayTime}, "${destination}");`
                        });
                        browser.tabs.onUpdated.removeListener(delayListen);
                    }
                });
            });
        }
    });
}

browser.runtime.onMessage.addListener(message => {
    passedDelay.push(message.newPassedDelay);
});

function getTresspassing(process) {
    // Grab blacklist
    return browser.storage.sync.get("blacklist").then(result => {
        // Process blacklist
        var urls = [];
        for (let site of result.blacklist) {
            urls.push('*://*.' + site + '/*');
            urls.push('*://' + site + '/*');
        }

        // Apply blacklist
        return browser.tabs.query({url: urls, active: true}).then(blacklisted => {

            // Grab whitelist
            return browser.storage.sync.get("whitelist").then(result => {
                // Process whitelist
                urls = [];  // Clear urls array for reuse
                for (let site of result.whitelist) {
                    urls.push('*://*.' + site + '/*');
                    urls.push('*://' + site + '/*');
                }

                // Apply whitelist
                return browser.tabs.query({url:urls, active: true}).then(whitelisted => {
                    return blacklisted.filter(blackSite => {
                        for (let whiteSite of whitelisted)
                            // If a whitelisted site is on the blacklist,
                            // return false to remove it from the blacklist.
                            if (blackSite.id == whiteSite.id) return false;
                        return true;
                    });
                });
            });
        });
    })
    .then(process);
}

// Create empty blacklist if it doesn't exist yet.
browser.storage.sync.get('blacklist').then(result => {
    if (!result.hasOwnProperty('blacklist')) {
        console.log('Creating empty blacklist');
        browser.storage.sync.set({blacklist: []});
    }
});

// Create empty whitelist if it doesn't exist yet.
browser.storage.sync.get('whitelist').then(result => {
    if (!result.hasOwnProperty('whitelist')) {
        console.log('Creating empty whitelist');
        browser.storage.sync.set({whitelist: []});
    }
});

// Create default notifications list and status if it doesn't exist yet.
browser.storage.sync.get('notifications').then(result => {
    if (!result.hasOwnProperty('notifications')) {
        console.log('Creating default notification at 15 minutes');
        browser.storage.sync.set({notifications: [15], notifyOn: true});
    }
});

// Create unused delay page if it doesn't exist yet.
browser.storage.sync.get(['delays', 'delayOn']).then(result => {
    if (!result.hasOwnProperty('delays') || !result.hasOwnProperty('delayOn')) {
        console.log('Creating default delay page of 0 minutes');
        browser.storage.sync.set({delays: 30, delayOn: false});
    }
});

function createNewHourglass() {
    console.log('Creating new hourglass');
    // Get today's date and set the hourglass to expire in its last minutes.
    var today = new Date(Date.now());
    today.setHours(23);
    today.setMinutes(59);
    today.setSeconds(59);
    today.setMilliseconds(999);
    browser.storage.sync.get('timeout').then(result => {
        browser.storage.sync.set({hourglass: result.timeout * 60,
                                  hourglassExpiry: today.getTime()});
        timeRemaining = result.timeout * 60;
    });

    console.log(`Hourglass expires ${today.toString()}`);
    console.log(`Hourglass refresh in ${today.valueOf() - Date.now().valueOf()} seconds`);
    setTimeout(createNewHourglass, today.valueOf() - Date.now().valueOf());
}

// Get and set timeout. If it doesn't exist, create it, defaulting to an hour.
// Then create a timer if it doesn't exist. Once timer is established, add the gatekeeper.
browser.storage.sync.get('timeout').then(result => {
    if (!result.hasOwnProperty('timeout')) {
        console.log('Setting default time allowance of one hour');
        browser.storage.sync.set({timeout: 1});
    } else {
        console.log(`Using stored time allowance of ${result.timeout} minutes.`);
    }
}).then(result => {
    browser.storage.sync.get(['hourglass', 'hourglassExpiry']).then(result => {
        // If there is no hourglass, OR if that hourglass has expired, make a new one.
        if (!result.hasOwnProperty('hourglass') ||
            Date.now() > result.hourglassExpiry) {
            createNewHourglass();
        } else {
            timeRemaining = result.hourglass;
            console.log(`Using stored hourglass with ${timeRemaining} seconds left.`);
            console.log(`Hourglass expires ${result.hourglassExpiry}`);
        }
    }).then(result => {
        browser.tabs.onUpdated.addListener(gatekeeper);
        browser.tabs.onActivated.addListener(gatekeeper);
    });
});
