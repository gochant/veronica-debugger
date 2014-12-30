define([], function () {

    var panelPort, // ��չ���ͺͽ�����Ϣ�Ķ˿�
        tabId;
    if (chrome.devtools) {
        tabId = chrome.devtools.inspectedWindow.tabId;  // ��ȡ��ǰ���ڵ� tabId

        // �������ӵ���չ�����������ߣ�������չ��background page����
        // �÷�����Ҫ��content scripts�����ӵ�����չ����ʱʹ�á�
        // ��֮������չ�����У���ͨ�� chrome.tabs.connect()��Ƕ���ڱ�ǩ�е�content script�������ӡ�
        panelPort = chrome.extension.connect({ name: "devtoolspanel" });

        panelPort.postMessage({
            name: "identification",
            data: tabId
        });
    }

    return panelPort;
});
