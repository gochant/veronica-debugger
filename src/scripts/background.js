// ��פ��̨����

var panelPorts = {};

// ���յ�����չ���̵�ҳ���content script����������ʱ����
chrome.extension.onConnect.addListener(function (port) {
    if (port.name !== "devtoolspanel") return;

    // ���յ�����չ���̵�ҳ���content script����һ����Ϣʱ����
    port.onMessage.addListener(function(message) {
        if (message.name == "identification") {
            var tabId = message.data;
            panelPorts[tabId] = port;  // ���ö˿ڻ��浽ȫ�ֱ���
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
