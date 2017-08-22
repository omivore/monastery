// blacklist.js

function loadSitelists() {
    for (let sitelist in sitelists) {
        browser.storage.sync.get(sitelist).then(result => {
            let select = document.querySelector(`#${sitelist} select`);

            // Purge the selects
            while (select.hasChildNodes()) select.removeChild(select.lastChild);

            // Repopulate and thus update the selects
            for (let i = 0; i < result[sitelist].length; i++)
                select.appendChild(new Option(result[sitelist][i]));

            // Adjust size of multiple select form
            // to list + 1, with min of 5 and max of 10
            select.size = Math.max(5, Math.min(result[sitelist].length + 1, 9));
        });
    }
}

function appendSitelist(sitelist) {
    var input = document.querySelector(`#${sitelist} input[type=text]`);

    updateSitelist(sitelist, list => {
        var newSitelist = validateList(sitelist, list, input.value);
        input.value = '';
        return newSitelist;
    });
}

function removeSitelist(sitelist) {
    var removal = []
    var select = document.querySelector(`#${sitelist} select`);
    for (let i = 0, option; i < select.length; i++) {
        option = select.options[i];
        if (option.selected) {
            removal.push(i);
        }
    }

    updateSitelist(sitelist, list => {
        for (let i = 0; i < removal.length; i++) {
            // Subtract the number of already removed elements due to shortened array.
            list.splice(removal[i] - i, 1);
        }
        return list;
    });
}

function updateSitelist(sitelist, modify) {
    browser.storage.sync.get(sitelist).then(result => {
        var newSitelist = (typeof result[sitelist] === 'undefined') ? [] : result[sitelist];
        newSitelist = modify(newSitelist);

        // Build the object so you can use string to assign a property
        var storageObject = {}
        storageObject[sitelist] = newSitelist;

        browser.storage.sync.set(storageObject).then(result => loadSitelists());

        console.log(`Storing new ${sitelist} of ${newSitelist}`);
    });
}

function validateList(sitelist, existList, addition) {
    var errorText = '';

    if (addition == '') errorText = 'No site provided.'
    else if (existList.indexOf(addition) != -1)
        errorText = 'Site is already on the list.'
    else existList.push(addition);

    var errorParagraph = document.querySelector(`#${sitelist} .errorField`);
    errorParagraph.textContent = errorText;
    errorParagraph.classList.add('shown');
    // Once the animation is done, remove the class
    setTimeout(() => {
        errorParagraph.textContent = '';
        errorParagraph.classList.remove('shown');
    }, 1000);
    return existList;
}

let sitelists = {"blacklist": document.querySelector('#blacklist'),
                 "whitelist": document.querySelector('#whitelist')};

// For each sitelist, load them, and attach the delete and add event listeners
for (let sitelist in sitelists) {
    document.addEventListener('DOMContentLoaded', event => {
        loadSitelists(sitelist);
    });

    document.querySelector(`#${sitelist} input[type=button]`).addEventListener('click', event => {
        approveEdit().then(approved => {
            if (approved) removeSitelist(sitelist);
        });
    });

    document.querySelector(`#${sitelist}`).addEventListener('submit', event => {
        event.preventDefault();
        appendSitelist(sitelist);
    });
}
