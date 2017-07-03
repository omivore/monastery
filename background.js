// background.js

let timeAllowance;  // Minutes allowed a day
var timeRemaining;  // Seconds left on the hourglass
var hourglass = null;

function gatekeeper(event) {
    browser.storage.sync.get('hourglass').then(result => {
        if (result.hourglass != 0) {    // Permitted Stage
            isTresspassing().then(tresspass => {
                if (tresspass) {
                    // Start or continue timer
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
        if (result.length > 0) return true;
        else return false;
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

function blockAll() {
    getTresspassing(result => {
        for (let tab of result) {
            browser.tabs.update(
                tab.id,
                {url: browser.extension.getURL('block_page.html')}
            );
        }
    });
}

function getTresspassing(process) {
    return browser.storage.sync.get('blacklist')
        .then(result => {
            var urls = [];
            for (let site of result.blacklist) {
                urls.push('*://*.' + site + '/*');
                urls.push('*://' + site + '/*');
            }
            return browser.tabs.query({url: urls, active: true});
        })
        .then(process);
}

// Create empty blacklist if it doesn't exist yet.
browser.storage.sync.get('blacklist').then(result => {
    if (Object.keys(result).length == 0) {
        console.log('Creating empty blacklist');
        browser.storage.sync.set({blacklist: []});
    }
});

// Create default notifications list if it doesn't exist yet.
browser.storage.sync.get('notifications').then(result => {
    if (Object.keys(result).length == 0) {
        console.log('Creating default notification at 15 minutes');
        browser.storage.sync.set({notifications: [15]});
    }
});

// Get and set the timeAllowance. If it doesn't exist, create it, defaulting to an hour.
// Then create a timer if it doesn't exist. Once timer is established, add the gatekeeper.
browser.storage.sync.get('timeout').then(result => {
    if (Object.keys(result).length == 0) {
        console.log('Setting default time allowance of one hour');
        browser.storage.sync.set({timeout: 60});
        timeAllowance = 60 * 60;    // One hour in seconds.
    } else {
        timeAllowance = result.timeout * 60;   // Convert minutes to seconds.
        console.log(`Using stored time allowance of ${result.timeout} minutes.`);
    }
}).then(result => {
    browser.storage.sync.get(['hourglass', 'hourglassExpiry']).then(result => {
        // If there is no hourglass, OR if that hourglass has expired, make a new one.
        if (Object.keys(result).length == 0 || Date.now() > result.hourglassExpiry ) {
            console.log('Creating new hourglass');
            // Get today's date and set the hourglass to expire in its last minutes.
            var today = new Date(Date.now());
            today.setHours(23);
            today.setMinutes(59);
            today.setSeconds(59);
            today.setMilliseconds(900);
            browser.storage.sync.set({hourglass: timeAllowance,
                                      hourglassExpiry: today});
            timeRemaining = timeAllowance;
            console.log(`Hourglass expires ${today.toString()}`);
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
