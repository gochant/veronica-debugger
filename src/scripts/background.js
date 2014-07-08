var panelPorts = {};

chrome.extension.onConnect.addListener(function (port) {
    if (port.name !== "devtoolspanel") return;

    port.onMessage.addListener(function(message) {
        if (message.name == "identification") {
            var tabId = message.data;
            panelPorts[tabId] = port;
        }
    });
});
chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
    if (message === 'haha') {
        window.postMessage('msg', '*');
    }
    if (sender.tab) {
        var port = panelPorts[sender.tab.id];
        if (port) {
            port.postMessage(message);
        }
    }
});
//chrome.tabs.onUpdated.addListener(function(updatedTabId, changeInfo) {
//    if (changeInfo.status == "loading") {
//        var port = panelPorts[updatedTabId];
//        if (port) {
//            port.postMessage({
//                target: 'page',
//                name: 'updated',
//                data: {
//                    urlChanged: changeInfo.url !== undefined
//                }
//            });
//        }
//    }
//});

//chrome.runtime.onInstalled.addListener(function(details) {
//    if (details.reason == "update") {
//        chrome.tabs.create({url: chrome.extension.getURL("updated.html")});
//    }
//});
