var port = browser.runtime.connect({name: "watchdog_port"});
port.postMessage({message: window.location});
