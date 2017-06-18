document.querySelector('#settings').addEventListener('click', function (event) {
    browser.runtime.openOptionsPage().catch(error => console.log(`Error: ${error}`));
});
