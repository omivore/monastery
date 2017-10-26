// delay_page.js

var delay = null;

function beginDelay(delayTime, destinationURL) {
    if (delay == null) {
        delay = setTimeout(() => {
            // Once delay is done, add this tab to the passedDelay list
            browser.tabs.update(
                {url: destinationURL}
            ).then(tab => {
                browser.runtime.sendMessage({'newPassedDelay': tab.id});
            });
        }, delayTime * 1000);
    }
}
