var globalTimer;
var globalQueue = new Set();
var globalCount = 0;

var globalConfig;

function onCompleted(details) {
    if (details.frameId != 0 || !details.url || isIgnoredUrl(details.url)) {
        return;
    }
    console.log("looking for and removing duplicate tabs of %s %s", details.tabId, details.url);
    chrome.tabs.get(details.tabId, removeDuplicateTabs);
}

function onClicked(tab) {
    if (globalTimer) {
        window.clearTimeout(globalTimer);
        globalTimer = null;
    }
    clearBadge();
}

function removeDuplicateTabs(tab) {
    if (typeof(tab) == "undefined") {
        console.log("bad tab")
        return;
    }
    console.log("removeDuplicateTabs(%s)", tab.id);

    var urlForComparison = getUrlForComparison(tab.url);

    chrome.tabs.getAllInWindow(tab.windowId, function(tabs) {
        var duplicates = tabs.filter(function(potentialDupTab) {
            if (tab.id == potentialDupTab.id || tab.pinned || tab.status != "complete") {
                return false;
            }

            return urlForComparison == getUrlForComparison(potentialDupTab.url);
        })

        removeTabs(duplicates);
    })

}

function logDuplicateTabs(tabs) {
    tabs.forEach(function(tab) {
        console.log("duplicate tab %s", tab.url);
    })
}

function clearBadge() {
    chrome.browserAction.setBadgeText({text: ""});
}

function setBadge(count) {
    var textCount = count.toString();
    if (count == 0) {
        textCount = "";
    }
    chrome.browserAction.setBadgeText({text: textCount})    
}

function updateBadge() {
    if (globalQueue.size > 0) {
        chrome.browserAction.setBadgeText({text: globalQueue.size.toString()})
    }
    else {
        chrome.browserAction.setBadgeText({text: ""})
    }
}
function removeTabs(tabs) {
    var tabIds = tabs.map(function(tab) { return tab.id});

    tabs.forEach(function(tab) {
        globalQueue.add(tab.id)
    })

    updateBadge();

    // If a timer is already pending, clear it and start the count again.
    // As long as the user keeps creating tabs we'll defer closing existing ones.
    if (globalTimer) {
        window.clearTimeout(globalTimer);
        globalTimer = null;
    }
    globalTimer = window.setTimeout(processGlobalQueue, 5000);
}

function processGlobalQueue() {
    globalQueue.forEach(function(tabId) {
        chrome.tabs.remove(tabId);
        globalQueue.delete(tabId);
        updateBadge();
    })
}
function showNotification(tabs, timer) {
    options = {
        type: 'progress',
        iconUrl: 'icon48.png',
        title: 'Removing Tabs',
        message: "Click",
        isClickable: true,
        progress: 30
    }
    chrome.notifications.create(null, options, function(id) {
        chrome.notifications.onClicked.addListener(function(nId) {
            if (id == nId) {
                console.log("clicked on the notification");
            }
        })
        chrome.notifications.onClosed.addListener(function(nId) {
            if (id == nId) {
                console.log("closed the notification");
            }
        })
    });
}
function getUrlForComparison(url) {
    var i;
    var urlForComparison = url;
    for (i = 0 ; i < globalConfig.urlPatterns.length ; i++) {
        match = url.match(globalConfig.urlPatterns[i]);

        if (match) {
            urlForComparison = match[0];
            break;
        }
    }

//    console.log("getUrlForComparison(%s) -> %s", url, urlForComparison);
    return urlForComparison;
}
function isIgnoredUrl(url) {
    return !!globalConfig.ignorePatterns.find(function(re) { return re.test(url)});
}


function onStorageChanged() {
    configLoad(function(loadedConfig){
        var f = function(s) { return new RegExp(s)}
        loadedConfig.urlPatterns = loadedConfig.urlPatterns.map(f)
        loadedConfig.ignorePatterns = loadedConfig.ignorePatterns.map(f)
        globalConfig = loadedConfig;
    });
}
chrome.storage.onChanged.addListener(onStorageChanged);
chrome.webNavigation.onCompleted.addListener(onCompleted);
chrome.browserAction.onClicked.addListener(onClicked);
