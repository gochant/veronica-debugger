window.addEventListener("message", function(event) {
    if (event.source != window) return;

    var message = event.data;
    chrome.extension.sendMessage(message); 
}, false);

window.addEventListener('DOMContentLoaded', function () {
    // 页面加载完毕后发布消息
    chrome.extension.sendMessage({
        target: 'page',
        name: 'ready'
    });
}, false);
