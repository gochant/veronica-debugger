define([], function () {
    var panelPort, tabId;
    if (chrome.devtools) {
        tabId = chrome.devtools.inspectedWindow.tabId;
        panelPort = chrome.extension.connect({ name: "devtoolspanel" });
        panelPort.postMessage({
            name: "identification",
            data: tabId
        });
    }

    return panelPort;
});
