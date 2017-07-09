
function restoreDefaultConfig() {
    console.log("restoreDefaultConfig")
    configRestoreDefault();
    setup();
}

function save() {
    var configValue = document.getElementById("config").value
    console.log("save", configValue);
    var config = JSON.parse(configValue);
    configSave(config)
    window.close();
}

function load() {
    console.log("load");
    configLoad(function(config) {
        document.getElementById("config").value = JSON.stringify(config, null, 4);
    })
}
function setup() {
    console.log("setup")
    document.getElementById("restore_defaults").addEventListener("click", restoreDefaultConfig);
    document.getElementById("save").addEventListener("click", save);
    load();
}

alert("woot");
document.addEventListener('DOMContentLoaded', setup);