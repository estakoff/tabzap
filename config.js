// Regular expressions need to be stored as strings, not the /exp/ notation

var defaultConfig = {
    ignorePatterns: [
        "^view-source:/",
        "^chrome://",
        "^chrome-extension://"
    ],
    urlPatterns: [
        "^https://drive.google.com/(corp/)?drive/(u/[0-9]/)?",
        "^https:\/\/keep.google.com\/",
        "^https://docs.google.com/([a-z]*/)?d/[^/]+/?",
        "^https://www.reddit.com/\?count=",
        "^[^#]*"
    ]
}

function configGetDefaults() {
    return JSON.parse(JSON.stringify(defaultConfig));
}
function configRestoreDefault() {
    configSave(defaultConfig);
}

function configLoad(fn) {
    chrome.storage.sync.get(defaultConfig, function(loadedConfig) {
        console.log("config loaded %s", JSON.stringify(loadedConfig));
        fn(loadedConfig);
    })
}

function configSave(source) {
    chrome.storage.sync.set(source);
}
