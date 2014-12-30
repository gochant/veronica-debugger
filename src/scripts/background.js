// 常驻后台程序

var panelPorts = {};

// 接收到本扩展进程的页面或content script发来的连接时触发
chrome.extension.onConnect.addListener(function (port) {
    if (port.name !== "devtoolspanel") return;

    // 接收到本扩展进程的页面或content script发送一条消息时触发
    port.onMessage.addListener(function(message) {
        if (message.name == "identification") {
            var tabId = message.data;
            panelPorts[tabId] = port;  // 将该端口缓存到全局变量
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
