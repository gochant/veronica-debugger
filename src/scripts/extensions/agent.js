window.__veronicaAgent = (function () {

    var isObject = function (target) {
        return typeof target == "object" && target !== null;
    };

    var onceDefined = function (object, property, callback) {
        if (object[property] !== undefined) callback(object[property]);
        watch(object, property, function handler(prop, action, newValue, oldValue) {
            if (newValue !== undefined) {
                unwatch(object, property, handler);

                callback(newValue);
            }
        });
    };
    var patchFunction = function (object, functionName, patcher) {
        var originalFunction = object[functionName];
        object[functionName] = patcher(originalFunction);

        var emptyFunction = function () { };
        object[functionName].toString = function () {
            return originalFunction ? originalFunction.toString.apply(originalFunction, arguments)
                                    : emptyFunction.toString.apply(emptyFunction, arguments);
        }
    };
    var patchFunctionLater = function (object, functionName, patcher) {
        if (object[functionName] === undefined) {
            onceDefined(object, functionName, function () {
                patchFunction(object, functionName, patcher);
            });
        } else {
            patchFunction(object, functionName, patcher);
        }
    };

    var createWidgetInfo = function (widget, core) {
        if (!widget) return false;
        var sandbox = widget.options.sandbox;
        var mainView = createViewInfo(widget, sandbox.name, core, true);
        return {
            name: sandbox.name,
            uplevel: sandbox._parent,
            ref: sandbox._id,
            views: [mainView].concat(_(widget._views).map(function (view, index) {
                return createViewInfo(view, index, core, false);
            }))
        }
    }

    var createViewInfo = function (view, name, core, isMain) {
        var sandbox = view.sandbox;
        return {
            name: name,
            ref: view.cid,
            isMain: isMain,
            subViews: _(view._views).map(function (item, index) {
                return index;
            }),
            subWindows: _(view._windows).map(function (item, index) {
                return index;
            }),
            subWidgets: sandbox ? sandbox._children.filter(function (item) {
                return view.cid === item.caller;
            }).map(function (item) {
                return {
                    ref: item.ref,
                    name: core.sandboxes.get(item.ref).name
                }
            }) : []
        };
    }

    var sendMessage = function (type, msg) {
        window.postMessage({
            type: type,
            data: msg
        }, '*');
    }

    window.addEventListener("message", function (event) {
        console.log(event.data);
    }, false);

    patchFunctionLater(window, "define", function (originalFunction) {
        return function () {

            var argumentsArray = Array.prototype.slice.call(arguments);

            for (var i = 0, l = argumentsArray.length; i < l; i++) {
                if (typeof argumentsArray[i] == "function") {

                    patchFunction(argumentsArray, i, function (originalFunction) {
                        return function (require, exports, modules) {
                            var module = originalFunction.apply(this, arguments);

                            var veronica = module || this;
                            var isVeronica = isObject(veronica) &&
                                             typeof veronica.createApp == "function" &&
                                             typeof veronica.getConfig == "function";
                            if (isVeronica) {

                                patchFunction(veronica, 'createApp', function (originFunc) {
                                    return function () {
                                        var app = originFunc.apply(veronica, arguments);
                                        window.__verApp = app;
                                        window._ = app.core._;
                                        return app;
                                    }
                                });
                            }

                            return module;
                        }
                    });

                    break;
                }
            }
            return originalFunction.apply(this, argumentsArray);
        }
    });

    window.createViewInfo = createViewInfo;
    window.createWidgetInfo = createWidgetInfo;

    return {
        // 获取应用程序信息（目前只用了这个方法）
        getAppInfo: function () {
            var app = window.__verApp;
            var widgetInfos = _.chain(app.sandboxes._sandboxPool).map(function (sandbox, key) {
                if (key === 'app-' + app.name) return;
                return createWidgetInfo(_.isFunction(sandbox.getHost) ? sandbox.getHost() : sandbox.getHost, app.core);
            }).compact().value();

            var result = {
                appInfo: {
                    name: app.name
                },
                widgetInfos: widgetInfos
            };
            return result;
        },
        reportView: function (widgetId, viewId, prop) {
            var app = window.__verApp;
            var widget = app.sandboxes._sandboxPool[widgetId].getHost();

            var view = viewId === '' ? widget : widget._views[viewId];
            if (prop === 'instance') {
                console.info(view);
            }
            if (prop === 'dom') {
                console.info(view.$el.get(0));
            }
            if (prop === 'viewmodel') {
                console.info(view.model().toJSON());
            }
            if (prop === 'tpl') {
                console.info(view.template);
            }

        },
        reportApp: function (prop) {
            var app = window.__verApp;
            if (prop === 'instance') {
                console.info(app);
            }
            if (prop === 'data') {
                console.info(app.data._data);
            }
        }
    };
})();

