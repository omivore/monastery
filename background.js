// background.js

var hourglass = null;
var delayed = [];

// Initialize all storage variables if nonexistent
browser.storage.local.get(['blockgroups', 'whitelist']).then(vars => {
    if (!vars.hasOwnProperty('blockgroups')) {
        browser.storage.local.set({blockgroups: {}});
        console.log("Initialized empty storage variable blockgroups");
    }
    if (!vars.hasOwnProperty('whitelist')) {
        browser.storage.local.set({whitelist: [
            browser.extension.getURL('pages/block_page.html'),
            browser.extension.getURL('pages/delay_page.html')
        ]});
        console.log("Initialized empty storage variable whitelist");
    }
});

// Declare objects
/**
 * Creates a Blockgroup data structure
 * blacklist is a list of URL strings to be blocked
 * allottedTime is an integer amount of minutes between 0 and 24 * 60
 * notifications is a Notifications object of if and when alerts should happen
 *      for this Blockgroup
 * delay is a Delay object associated with this Blockgroup
 * hourglass is the Hourglass object associated with this Blockgroup
 */
function Blockgroup(blacklist, allottedTime, notifications, delay) {
    return {
        blacklist: blacklist,
        allottedTime: allottedTime,
        notifications: notifications,
        delay: delay,
        hourglass: Hourglass(allottedTime)
    };
}

/**
 * Creates a Notifications object
 * notifications is a list of integer times remaining for when alerts happen
 * isActivated is a boolean representing whether notifications are turned on
 */
function Notifications(notifications, isActivated) {
    return {
        notifications: notifications,
        isActivated: isActivated
    };
}

/**
 * Creates a Delay object
 * delay is an integer amount of seconds > 0 for how long a delay should be
 * isActivated is a boolean representing whether delay is turned on
 */
function Delay(delay, isActivated) {
    return {
        delay: delay,
        isActivated: isActivated
    };
}

/**
 * Creates Hourglass object
 * allottedTime is the starting amount of time for this hourglass
 * timeLeft is the amount of time left until the hourglass expires
 * isActive is a boolean of whether the hourglass is running or not
 */
function Hourglass(allottedTime) {
    return {
        allottedTime: allottedTime,
        timeLeft: allottedTime,
        isActive: false
    };
}
function startHourglass(timer) {
    console.log("Starting hourglass");
    window.clearInterval(hourglass);
    hourglass = window.setInterval(() => {
        timer.timeLeft -= 1;
        tick(timer);
    }, 1000);

    timer.isActive = true;
};
function stopHourglass(timer) {
    console.log("Stopping hourglass");
    window.clearInterval(hourglass);
    timer.isActive = false;
}

// Processing functions
/**
 * matchActive return list of Tab objects that fit in urls but not in ignore
 * urls is a list of string URL match patterns
 * ignore is an optional list of string URL match patterns too
 */
function matchActive(urls, ignore = []) {
    return Promise.all([
        browser.tabs.query({url: matchers(urls), active: true}),
        browser.tabs.query({url: matchers(ignore), active: true})
    ]).then((blacks) => {
        return blacks[0].filter(tab => !blacks[1].includes(tab));
    });
}

/**
 * Returns all the urls in format for Firefox's URL matcher
 */
function matchers(urls) {
    var matchers = [];
    for (let site of urls) {
        matchers.push('*://*.' + site + '/*');
        matchers.push('*://' + site + '/*');
    }
    return matchers;
};

function tick(timer) {
    console.log(timer);
}

function blockTab(tab) {
    browser.tabs.update(
        tab.id,
        {url: browser.extension.getURL('pages/block_page.html')}
    );
}

function delayTab(tab) {

}

function setIcon(state) {
    switch (state) {
        case setIcon.State.blocking:
            browser.browserAction.setIcon({
                path: { 48: 'icons/monastery_lock.svg' },
            });
            break;
        case setIcon.State.delay:
            browser.browserAction.setIcon({
                path: { 48: 'icons/monastery_delay.svg' },
            });
            break;
        default:
        case setIcon.State.neutral:
            browser.browserAction.setIcon({
                path: { 48: 'icons/monastery.svg' },
            });
            break;
    }
}
setIcon.State = {
    blocking: "blocking",
    delay: "delay",
    neutral: "neutral",
};

// Set up tab watching
function gatekeeper(event) {
    browser.storage.local.get(['blockgroups', 'whitelist']).then(vars => {
        for (let key in vars.blockgroups) {
            var blockgroup = vars.blockgroups[key];
            console.log(blockgroup);
            matchActive(blockgroup.blacklist, vars.whitelist).then(blacks => {
                console.log(blacks);
                if (blacks.length > 0) {
                    // The current page tresspasses this blockgroup
                    let active = blacks[0];
                    if (blockgroup.delay.isActivated) {
                        if (delayed.includes(active.id)) {
                            setIcon(setIcon.State.blocking);
                            startHourglass(blockgroup.hourglass);
                        } else {
                            setIcon(setIcon.State.delay);
                            delayTab(active);
                        }
                    } else {
                        if (blockgroup.hourglass.timeLeft > 0) {
                            setIcon(setIcon.State.blocking);
                            startHourglass(blockgroup.hourglass);
                        } else blockTab(active);
                    }
                    return;
                } else {
                    // The current page is innocent of *this* blockgroup
                    setIcon(setIcon.State.neutral);
                    stopHourglass(blockgroup.hourglass);
                }
            });
        }
    }, error => console.log(error));
}

browser.tabs.onUpdated.addListener(gatekeeper);
browser.tabs.onActivated.addListener(gatekeeper);

// Tests
// TODO: remove tests

/* Test matchActive
browser.tabs.onUpdated.addListener((event) => {
    console.log("updated");
    matchActive(new MatchList(["reddit.com", "facebook.com"])).then(results => {
        console.log(results);
    });
});
browser.tabs.onActivated.addListener((event) => {
    console.log("activated");
    matchActive(new MatchList(["reddit.com", "facebook.com"])).then(results => {
        console.log(results);
    });
});*/

// Test blockgroups
//console.log("test");
let testBlock = Blockgroup(["reddit.com", "facebook.com"], 1, Notifications([], false), Delay(10, false));
//console.log(testBlock);
//console.log("thing ");
//console.log(thing);
browser.storage.local.set({blockgroups: {
    "reddit.com": testBlock
}});
browser.storage.local.get('blockgroups').then(r => {
    console.log(r.blockgroups);
});
