var globalTimer;
var globalQueue = [];
var globalCount = 0;

function onCompleted(details) {
    if (details.frameId != 0 || isUrlEmpty(details.url) || isUrlImmune(details.url)) {
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
    chrome.browserAction.setBadgeText({text: count.toString()})    
}
function removeTabs(tabs) {
    if (tabs.length) {
        setBadge(tabs.length)
    }
    
    var tabIds = tabs.map(function(tab) { return tab.id});

    globalQueue.push(tabIds);

    globalCount += tabIds.length;
    setBadge(globalCount);

    // If a timer is already pending, clear it and start the count again.
    // As long as the user keeps creating tabs we'll defer closing existing ones.
    if (globalTimer) {
        window.clearTimeout(globalTimer);
        globalTimer = null;
    }
    globalTimer = window.setTimeout(processGlobalQueue, 5000);
}

function processGlobalQueue() {
    globalCount = 0;
    clearBadge();
    while (globalQueue.length > 0) {
        chrome.tabs.remove(globalQueue.pop());
    }
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
var builtinUrlPatterns = [
    /^https:\/\/drive.google.com\/(corp\/)?drive\/(u\/[0-9]\/)?/,
    /^https:\/\/keep.google.com\//,
    /^https:\/\/docs.google.com\/([a-z]*\/)?d\/[^\/]+\/?/,
    /^[^#]*/
]
function getUrlForComparison(url) {
    var i;
    var urlForComparison = url;
    for (i = 0 ; i < builtinUrlPatterns.length ; i++) {
        match = url.match(builtinUrlPatterns[i]);

        if (match) {
            urlForComparison = match[0];
            break;
        }
    }

//    console.log("getUrlForComparison(%s) -> %s", url, urlForComparison);
    return urlForComparison;
}
var builtInImmunePrefixes = [
    "view-source:/",
    "chrome://",
    "chrome-extension://"
]
function isUrlImmune(url) {
    var i;
    var immune = false;
    for (i = 0 ; i < builtInImmunePrefixes ; i++) {
        if (url.startsWith(builtInImmunePrefixes[i])) {
            immune = true;
            break;
        }
    }
//    console.log("isUrlImmune(%s) -> %s", url, immune);
    return immune;
}

function isUrlEmpty(url) {
    var empty = !url || url == '';
//    console.log("isUrlEmpty(%s) -> %s", url, empty);
}

chrome.webNavigation.onCompleted.addListener(onCompleted);
chrome.browserAction.onClicked.addListener(onClicked);
