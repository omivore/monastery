// background.js

// Initialize all storage variables if nonexistent
browser.storage.sync.get(['blockgroups', 'whitelist']).then(result => {
    if (!result.hasOwnProperty('blockgroups')) {
        browser.storage.sync.set({blockgroups: []});
    }
    if (!result.hasOwnProperty('whitelist')) {
        browser.storage.sync.set({whitelist: []});
    }
});

// Declare objects
/**
 * Creates a Blockgroup object
 * blacklist is a list of URL strings to be blocked
 * allottedTime is an integer amount of minutes between 0 and 24 * 60
 * notifications is a Notifications object of if and when alerts should happen
 *      for this Blockgroup
 * delay is a Delay object associated with this Blockgroup
 */
function Blockgroup(blacklist, allottedTime, notifications, delay) {
    this.blacklist = blacklist;
    this.allottedTime = allottedTime;
    this.notifications = notifications;
    this.delay = delay;
}

/**
 * Creates a Notifications object
 * notifications is a list of integer times remaining for when alerts happen
 * isActivated is a boolean representing whether notifications are turned on
 */
function Notifications(notifications, isActivated) {
    this.notifications = notifications;
    this.isActivated = isActivated;
}

/**
 * Creates a Delay object
 * delay is an integer amount of seconds > 0 for how long a delay should be
 * isActivated is a boolean representing whether notifications are turned on
 */
function Delay(delay, isActivated) {
    this.delay = delay;
    this.isActivated = isActivated;
}

/**
 * Creates MatchList object
 * urls is a list of string urls, e.g. www.google.com or facebook.com/messages
 * getMatchers() returns all the urls in format for Firefox's URL matcher
 */
function MatchList(urls) {
    this.urls = urls;
    this.matchers = () => {
        matchers = [];
        for (let site of this.urls) {
            matchers.push('*://*.' + site + '/*');
            matchers.push('*://' + site + '/*');
        }
        return matchers;
    };
}

// Processing functions
/**
 * matchActive return list of Tab objects that fit in urls but not in ignore
 * urls is a list of string URL match patterns
 * ignore is an optional list of string URL match patterns too
 */
function matchActive(urls, ignore = new MatchList([])) {
    return Promise.all([
        browser.tabs.query({url: urls.matchers(), active: true}),
        browser.tabs.query({url: ignore.matchers(), active: true})
    ]).then((results) => {
        console.log(results);
        return results[0].filter(tab => !results[1].includes(tab));
    });
}

// Set up tab watching
function gatekeeper(event) {
    browser.storage.sync.get(['blockgroups', 'whitelist']).then(results => {
        // Process each blockgroup in regards to this tab
    });
}

browser.tabs.onUpdated.addListener(gatekeeper);
browser.tabs.onActivated.addListener(gatekeeper);

// Tests
// TODO: remove tests

// Test matchActive
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
});
