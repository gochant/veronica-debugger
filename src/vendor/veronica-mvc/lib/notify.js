define([
    'pnotify'
], function () {
    return function (app) {
        var $ = app.sandbox.$;
        var _ = app.sandbox._;
        var kendo = window.kendo;
        var ext = app.core.ext;
        var sandbox = app.sandbox;

        var stack = {
            dir1: "down",
            dir2: "left",
            push: "top",
            spacing1: 25,
            spacing2: 25,
            context: $("body")
        };
        var defaults = {
            animate_speed: 'fast',
            shadow: true,
            closer: true,
            sticker: false,
            delay: 8000,
            styling: 'bootstrap3',
            type: 'alert',
            icon: true,
            history: false,
            addclass: 's-notify',
            stack: stack,
            labels: {
                redisplay: '重现',
                all: '所有',
                last: '最后',
                close: '关闭',
                stick: '固定'
            }
        };

        var notifyInstance;  // 页面唯一notify实例

        var notify = function (options) {
            options || (options = {});
            if (_.isString(options)) {
                options = { text: options };
            }
            _.defaults(options, defaults);
            if ($('.s-notify').length > 0) {
                notifyInstance.pnotify(options);
            } else {
                notifyInstance = $.pnotify(options).on('click', '.watch-detail', function (e) {
                    var $target = $(e.currentTarget).siblings('.detail');
                    $target.hasClass('hidden') ? $target.removeClass('hidden') : $target.addClass('hidden');
                }).on('click', '[data-emit]', function (e) {
                    var emit = $(e.currentTarget).data('emit');
                    if (emit) {
                        sandbox.emit(emit);
                    }
                });
            }

            return notifyInstance;
        };

        // 根据不同的结果，调用不同类型提示框
        var notifyResult = function (msg, success, options) {
            var type = (success && success === true) ? 'success' : 'error';
            options || (options = {});
            return notify($.extend({
                text: msg,
                type: type
            }, options));
        };

        // 根据后台响应显示通知
        var notifyByResp = function (resp) {
            if (!resp) return;

            // 超时
            if (resp.level === 0) {
                if (resp.data === "ServiceTimeout") {

                }
            }
            // 仅通知
            if (resp.level === 1) {
                notifyResult(resp.msg, resp.success);
            }
            // 仅记日志
            if (resp.level === 2) {  // Log
                log(resp.msg, resp.success);
            }

            // 通知日志都记录
            if (resp.level === 4) {  // Complex
                var msgs = resp.msg.split('###');
                msgs[0] += '<a class="watch-detail" href="javascript:">查看详情</a>';
                msgs[1] = '<div class="detail hidden">' + msgs[1] + '</div>';
                notifyResult(msgs[0] + msgs[1], resp.success);
                //log(msgs[1], resp.success);
            }
            // 使用对话框提示
            if (resp.level === 5) {  // 对话框

                // 是超时消息，并且在iframe里
                if (resp.data === "Timeout" && top !== window) {
                    // TODO: 向外层发布一个消息

                }

                // 只有当feedback对话框不存在时才弹出对话框
                if ($('.dlg-fd-modal').length === 0) {
                    var wnd = $('<div class="dlg-fd-modal" style="font-size:1.1em;line-height:1.5em;">' + resp.msg + '</div>').kendoWindow({
                        appendTo: document.body,
                        draggable: false,
                        actions: false,
                        resizable: false,
                        title: '注意',
                        width: 250,
                        height: 60,
                        modal: true
                    }).data('kendoWindow');
                    wnd.center();
                    wnd.open();
                }

            }
            // 仅错误时通知
            if (resp.level === 6) {  // 只报告错误
                if (resp.succcess === false) {
                    notifyResult(resp.msg, resp.success);
                }
            }
            // 未授权
            if (resp.errors && resp.errors === 'NoAuth') {
                window.location.replace(resp.data);
            }
        };

        var process = function () {

        }

        app.sandbox.on('notifyByResp', function (feedback) {
            notifyByResp(feedback);
        });
        app.sandbox.on('notify', function (options) {
            notify(feedback);
        });

        // 自动报告
        if (app.config.autoReport) {
            $(document).ajaxSuccess(function (e, xhr, f, resp) {
                notifyByResp(resp);
            });
        }

        return {
            resp: notifyByResp,
            normal: notify,
            process: process
        }
    };
});