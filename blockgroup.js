// blockgroup.js
/**
 * Creates a Blockgroup data structure
 * id is a unique identifier to make the storage blockgroups mutable
 * blacklist is a list of URL strings to be blocked
 * allottedTime is an integer amount of minutes between 0 and 24 * 60
 * notifications.notifications is a list of if and when alerts should happen
 * notifications.isNotificationsActive is whether notifications are on
 * delay.delay is an integer amount of seconds to delay blocked pages
 * delay.isDelayActive is whether delay is being used
 * hourglass.allottedTime is the minutes allowed per day
 * hourglass.timeLeft is the minutes left to use in the current day
 * hourglass.isActive is whether this hourglass is currently running
 */
function Blockgroup(blacklist, allottedTime,
                    notifications, isNotificationsActive,
                    delay, isDelayActive) {
    return {
        id: Date.now(),
        name: "New Blockgroup",
        blacklist: blacklist,
        allottedTime: allottedTime,
        notifications: {
            notifications,
            isNotificationsActive
        },
        delay: {
            delay,
            isDelayActive
        },
        hourglass: {
            allottedTime: allottedTime,
            timeLeft: allottedTime * 60,
            isActive: false
        }
    };
}

function updateBlockgroup(blockgroup) {
    console.log("Updating blockgroup \"" + blockgroup.name + "\"");
    return browser.storage.local.get('blockgroups').then(result => {
        result.blockgroups[blockgroup.id] = blockgroup;
        browser.storage.local.set({
            blockgroups: result.blockgroups
        });
    });
}
