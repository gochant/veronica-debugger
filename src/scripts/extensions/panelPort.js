define([], function () {

    var panelPort, // 扩展发送和接收消息的端口
        tabId;
    if (chrome.devtools) {
        tabId = chrome.devtools.inspectedWindow.tabId;  // 获取当前窗口的 tabId

        // 尝试连接到扩展内其他监听者（比如扩展的background page）。
        // 该方法主要由content scripts在连接到其扩展进程时使用。
        // 反之，在扩展进程中，可通过 chrome.tabs.connect()与嵌入在标签中的content script进行连接。
        panelPort = chrome.extension.connect({ name: "devtoolspanel" });

        panelPort.postMessage({
            name: "identification",
            data: tabId
        });
    }

    return panelPort;
});
