function reload(message) {
    if (message.reload) {
        setSiteFilter();
    }
}

function gatekeep(details) {
    console.log("blocking this page");
    return {cancel: true};
}

function setSiteFilter() {
    browser.webRequest.onBeforeSendHeaders.removeListener(gatekeep);
    browser.storage.sync.get("blacklist")
        .then(result => {
            var urls = [];
            for (let site of result.blacklist) {
                urls.push("*://*." + site + "/*");
                urls.push("*://" + site + "/*");
            }
            browser.webRequest.onBeforeSendHeaders.addListener(gatekeep,
                                                               {urls: urls},
                                                               ["blocking"]);
        })
        .catch(error => {
            console.log(`Error: ${error}`);
        });
}

browser.runtime.onMessage.addListener(reload);
setSiteFilter();
