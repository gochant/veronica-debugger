define([
    'veronica',
    'extensions/panelPort'
], function (core, panelPort) {

    var app = core.createApp('test', {
        autoReport: false
    });
    var $ = core.$;

    app.use('veronica-mvc');

    if (chrome.devtools) {
        // 接收到本扩展进程的页面或content script发送一条消息时触发
        panelPort.onMessage.addListener(_.bind(function (message) {
            // if (message.type === 'addWidget') {
            app.sandbox.emit('modify', message);
            //  }
        }, this));
    }
    var reloadInjecting = function (scripts, injectionData) {
        var scriptsContents = [];
        var scriptsLoaded = 0;
        for (var i = 0, l = scripts.length; i < l; i++) {
            (function (i) {
                $.ajax({
                    url: chrome.extension.getURL(scripts[i])
                }).done(function (data) {
                    scriptsContents[i] = "eval(" + JSON.stringify("//@ sourceURL=" + scripts[i] + "\n" + data) + ");";

                    scriptsLoaded++;
                    if (scriptsLoaded == scripts.length) {
                        var toInject = scriptsContents.join('\n') + "\n";
                        chrome.devtools.inspectedWindow.reload({
                            ignoreCache: true,
                            injectedScript: toInject
                        });

                        //injectionData = (injectionData !== undefined) ? injectionData : {};
                        //var injectionDataCode = "var injectionData = " + JSON.stringify(injectionData) + ";\n";
                        //toInject = injectionDataCode + toInject;


                    }
                });

            })(i);
        }
    };

    // 重加载当前页面，并注入脚本
    app.reloadPage = function () {
        reloadInjecting(['vendor/Watch.JS/src/watch.js', 'scripts/extensions/agent.js']);
    }

    app.launch().done(function () {

        app.addPage({
            'home': {
                name: '部件信息',
                widgets: [{
                    name: 'devtools',
                    options: {
                        host: '#devtools'
                    }
                }]
            }
        });

        app.sandbox.on('appStarted', function () {
            app.startRouter();
            $('#global-loading').remove();
        });

        app.startPage();
    });
});