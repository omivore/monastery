var port;

function connected(receivedPort) {
    port = receivedPort;
    port.onMessage.addListener(processReport);
}

browser.runtime.onConnect.addListener(connected);

function processReport(message) {
    console.log(message.message.origin);
}
