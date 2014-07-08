define(function () {

    var base;
    var WND_CONTAINER = '#ver-modal';

    base = function (app) {
        return {
            template: null,
            defaults: {},
            views: {},
            aspect: $.noop,
            subscribe: $.noop,  // 监听外部的消息
            listen: $.noop,  // 监听子视图
            enhance: $.noop,  // 进行UI增强
            init: $.noop,
            initAttr: $.noop,  // 初始化属性
            listenSelf: $.noop,  // 监听自身事件
            resize: $.noop,  // 自适应布局
            delegateModelEvents: $.noop,  //

            initialize: function (options) {
                var me = this;
                options || (options = {});
                this.binds = ['resize'];
                this._windows = {};  // 子窗口集合
                this._views = {};  // 子视图集合
                this._delayEvents = [];
                this.baseModel = {};  // 默认的基本视图模型
                this.viewModel = {};  // 该视图的视图模型
                this._activeViewName = null;

                this.options = $.extend(true, {
                    autoAction: false,  // 自动绑定Action事件
                    autoRender: true,  // 自动渲染
                    autoResize: false,  // 自适应布局
                    autoST: false,
                    switchable: [],
                    toolbar: null,
                    sharedModel: null,  // 共享的视图模型
                    sharedModelProp: null,  // 共享视图模型的属性集合
                    langClass: null,
                    bindEmptyModel: false
                }, this.defaults, options);

                // 将方法绑定到当前视图
                if (this.binds) {
                    this.binds.unshift(this);
                    _.bindAll.apply(_, this.binds);
                }

                // 混入AOP方法
                app.core.util.extend(this, app.core.aspect);
                this.aspect();
                this.listenSelf();  // 自身事件监听
                if (this.options.autoResize) {
                    this.listenTo(this, 'rendered', function () {
                        _.defer(me.resize);
                    });
                    $(window).on('resize', this.resize);
                }
                this.listenTo(this, 'modelBound', function (model) {
                    // 更新子视图模型
                    _(me._views).each(function (view) {
                        if (view.options.sharedModel) {
                            view.model(view.shareModel(model));
                        }
                    });
                });
                this.listenTo(this, 'rendering', function () {
                    this._renderSubViews();
                });
                this.listenTo(this, 'rendered', function () {
                    // 在渲染视图后重新绑定视图模型
                    this._bindViewModel();
                    this.options.autoST && this.setTriggers();

                });

                (this.options.sharedModel != null) && this.model(this.shareModel(this.options.sharedModel), false);

                // 初始化自定义属性
                this.initAttr();

                this.subscribe();  // 初始化广播监听
                this.init();

                if (this.options.autoAction) {
                    // 代理默认的事件处理程序
                    this.events || (this.events = {});
                    $.extend(this.events, {
                        'click [data-action]': '_actionHandler'
                    });
                }

                // 渲染
                this.options.autoRender && this.render();

                // 添加子视图监听
                this.listen();
            },
            // 渲染子视图
            _renderSubViews: function () {
                var that = this;
                if (_.size(this.views) > 0) {
                    // 渲染子视图
                    _.each(this.views, function (func, name) {
                        if (_.isFunction(func)) {
                            that.view(name, func.apply(that));
                        }
                    });
                    // 设置默认活动视图
                    this.views['active'] && this.active();
                }
            },
            // 显示该视图
            show: function () {
                var me = this;
                this.$el.show(false, function () {
                    if (me.options.autoResize) {
                        me.resize();
                    }
                });
            },
            // 隐藏该视图
            hide: function () {
                this.$el.hide(false);
            },
            // 获取或设置子视图
            view: function (name, view) {
                var me = this;
                if (_.isUndefined(view)) {
                    return this._views[name];

                } else {
                    this._destroyView(name);
                    this._views[name] = view;
                    _.chain(this._delayEvents).filter(function (obj) {
                        return obj.name === name;
                    }).each(function (obj) {
                        me.listenTo(view, obj.event, obj.callback);
                    });
                    return view;
                }
            },
            // 激活子视图
            active: function (name) {
                var me = this;
                if (_.isUndefined(name)) {
                    this._activeViewName = this.views.active;
                } else {
                    this._activeViewName = name;
                }

                _(this.options.switchable).each(function (name) {
                    me.view(name) && me.view(name).hide();
                });
                var targetView = this.view(this._activeViewName);
                targetView.show();

                // 触发事件
                this.trigger('activeView', this._activeViewName);
                targetView.trigger('active');

            },
            // 装载视图模型（数据， 是否更新视图绑定-默认更新）
            model: function (data, bind) {
                if (!_.isUndefined(data)) {

                    if (data.toJSON) { // 本身就是viewModel对象
                        this.viewModel = data;
                    } else {
                        this.viewModel = app.mvc.baseViewModel($.extend({}, this.baseModel, data));
                    }

                    this.delegateModelEvents(this.viewModel);
                    if (bind !== false) {
                        this._bindViewModel();
                    }
                }
                return this.viewModel;
            },
            // 创建共享视图模型
            shareModel: function (model) {
                if (_.isUndefined(model)) {
                    model = this.options.sharedModel;
                }
                var props = this.options.sharedModelProp;
                if (model) {
                    if (props) {
                        return _.map(props, function (prop) {
                            var r = {};
                            if (_.isString(prop)) {
                                r[prop] = model.get(prop);
                            } else {
                                r[prop[0]] = model.get(prop[1]);
                            }
                            return r;
                        });
                    }
                    return model;
                }
                return {};
            },
            // 绑定方法
            _bind: function () {
                // 重绑定视图模型
                kendo.unbind(this.$el);
                kendo.bind(this.$el, this.viewModel);
            },
            _bindViewModel: function () {
                var sandbox = this.options.sandbox;
                if (!this.options.bindEmptyModel && $.isEmptyObject(this.viewModel)) {
                    return;
                }

                this._bind();

                // TODO: 这里需要 kendo.binder 更改代码
                // 为： if(!$(childrenCopy[idx]).hasClass('k-bind-block'))
                //        bindElement(childrenCopy[idx], source, roles, parents);
                if (!this.$el.hasClass('k-bind-block')) {
                    this.$el.addClass('k-bind-block');
                }
                this.trigger('modelBound', this.viewModel);
                sandbox.log(this.cid + ' modelBound');
            },
            // 渲染界面
            render: function () {
                var tpl = _.isFunction(this.template) ?
                    this.template : _.template(this.template);
                var html = tpl(_.extend({ lang: app.lang[this.options.langClass] }, this.options));
                var sandbox = this.options.sandbox;
                html && this.$el.html(html);
                this.trigger('rendering');
                this.enhance();
                this.options.host && this.$el.appendTo(this.options.host);
                sandbox.log(this.cid + ' rendered');
                this.trigger('rendered');
                return this;
            },
            instance: function (el) {
                return kendo.widgetInstance(this.$(el));
            },
            listenToDelay: function (name, event, callback) {
                this._delayEvents.push({
                    name: name,
                    event: event,
                    callback: callback
                });
                if (this.view(name)) {
                    this.listenTo(this.view(name), event, callback);
                }
            },
            // 获取或创建一个window
            window: function (config, isShow) {

                var wnd;
                var sandbox = this.options.sandbox;
                var windows = this._windows;
                // 获取窗口
                if (_.isString(config)) {
                    return windows[config];
                }
                if (windows[config.name]) {
                    return windows[config.name];
                }
                var isDestroyed = {};
                // 默认配置
                var defaults = {
                    name: '',  // 窗口的唯一标识码
                    type: 'normal',
                    el: null,
                    center: true,
                    options: {
                        // appendTo: $(WND_CONTAINER),
                        animation: {
                            open: false,
                            close: false
                        },
                        resizable: false,
                        draggable: false,
                        show: false,
                        visible: false,
                        pinned: false
                    },
                    children: null,
                    widgetOpt: null,
                    viewOpt: null
                };
                // 创建 Widget
                var createWidget = function (widgetOpt, wnd) {
                    var $wndEl = wnd.element.find('.fn-wnd');
                    if ($wndEl.length === 0) $wndEl = wnd.element;
                    _(widgetOpt).each(function (opt) {
                        opt.options || (opt.options = {});
                        if (opt.options.host) {
                            opt.options.host = $wndEl.find(opt.options.host);
                        } else {
                            opt.options.host = $wndEl;
                        }
                        opt.options.parentWnd = wnd;
                    });

                    sandbox.startWidgets(widgetOpt).done(function () {
                        $el.find('.fn-s-loading').remove(); // 插件加载完毕后移除加载图片
                    });
                };
                // 创建 View
                var createView = function (viewOpts, wnd) {
                    var me = this;
                    var $wndEl = wnd.element;
                    _.each(viewOpts, function (viewOpt) {
                        var host = $wndEl.find('.fn-wnd');
                        var view = me.view(viewOpt.name, viewOpt.instance(_.extend({
                            host: host.length === 0 ? $wndEl : host,
                            sandbox: sandbox,
                            parentWnd: wnd
                        }, viewOpt.options)));

                        isDestroyed[viewOpt.name] = view;
                    });

                };
                var defaultWnd = '<div><div class="fn-wnd"><div class="k-loading-image fn-s-loading"></div></div></div>';

                isShow = isShow == null ? true : isShow;

                config = $.extend(true, defaults, config);

                var $el = config.el == null ? $(defaultWnd) : $(config.el);
                var destroy = _.bind(function () {
                    (_.bind(function () {
                        var me = this;
                        // 销毁窗口内的子视图
                        _.each(isDestroyed, function (view, name) {

                            me._destroyView(name);
                        });

                        // 销毁窗口内的子部件
                        sandbox.app.core.stop($el);
                    }, this))();

                    this._destroyWindow(config.name);

                }, this);

                if (config.type === 'modal') {
                    $el.modal({
                        show: false
                    });
                    wnd = {
                        element: $el,
                        close: function () {
                            this.element.modal('hide');
                        },
                        center: function () { },
                        open: function () {
                            this.element.modal('show');
                        }
                    }
                    wnd.element.one('hidden.bs.modal', destroy);
                } else {
                    $el.kendoWindow(config.options);
                    wnd = $el.data('kendoWindow');
                    if (config.type !== 'normal') { wnd.bind('close', destroy); }
                }

                if (config.children) {
                    var widgets = [];
                    var views = [];
                    _.each(config.children, function (conf) {
                        var type = conf.type || config.type;
                        if (type === 'view') { views.push(conf) };
                        if (type === 'widget') { widgets.push(conf) };
                    });
                    createView.call(this, views, wnd);
                    if (widgets.length === 0) {
                        $el.find('.fn-s-loading').remove();
                    }
                    createWidget.call(this, widgets, wnd);
                }

                // 兼容老的写法
                config.widgetOpt && createWidget.call(this, config.widgetOpt, wnd);
                if (config.viewOpt) {
                    createView.call(this, [config.viewOpt], wnd);
                    $el.find('.fn-s-loading').remove();
                }

                if (wnd) {
                    windows[config.name] = wnd;
                }

                if (config.center) {
                    //$el.closest('.k-window').css({
                    //    'position': 'relative',
                    //    'margin': '30px auto'
                    //});
                    wnd.center();
                }

                if (isShow) {
                    // $('body').addClass('modal-open');
                    wnd.open();
                    // $(WND_CONTAINER).scrollTop(0).show();
                }

                return wnd;

            },
            // 订阅消息
            sub: function (name, listener) {
                this.options.sandbox.on(name, listener, this, this.cid);
            },
            // 发布消息
            pub: function () {
                this.options.sandbox.emit.apply(this.options.sandbox,
                    Array.prototype.slice.call(arguments));
            },
            // 取消订阅消息
            unsub: function () {
                this.options.sandbox.stopListening(this.cid);
            },
            // 启用子部件
            startWidgets: function (list) {
                this.options.sandbox.startWidgets(list, null, this.cid);
            },
            // 停用该视图创建的子部件
            stopChildren: function () {
                this.options.sandbox.stopChildren(this.cid);
            },
            setTriggers: function () {
                var sandbox = this.options.sandbox;
                sandbox.emit('setTriggers', this.$('.tpl-toolbar').html(),
                    this.options.toolbar || sandbox.name, this);
            },
            _actionHandler: function (e, context) {
                e.preventDefault();
                context || (context = this);
                var $el = $(e.currentTarget);
                if ($el.closest('script').length > 0) return;
                var actionName = $el.data().action;
                if (actionName.indexOf('Handler') < 0) {
                    actionName = actionName + 'Handler';
                }
                context[actionName] && context[actionName](e);
            },
            _destroyView: function (viewName) {
                var me = this;
                if (_.isUndefined(viewName)) {
                    // 销毁所有子视图
                    _(this._views).each(function (view, name) {
                        me._destroyView(name);
                    });
                } else {
                    var view = this.view(viewName);
                    if (view) {
                        view.stopChildren && view.stopChildren();
                        view.unsub && view.unsub();
                        view.destroy && view.destroy();
                        view.remove && view.remove();
                        view.sandbox && (view.sandbox = null);

                        // 移除对该 view 的引用
                        this._views[viewName] = null;
                        delete this._views[viewName]
                    }
                }
            },
            // 销毁窗口
            _destroyWindow: function (name) {
                var window = this._windows[name];
                if (window.destroy) {
                    window.destroy();
                } else {
                    $(window).remove();
                }

                delete this._windows[name];
            },
            _destroy: function () {
                // 清理在全局注册的事件处理器
                this.options.autoResize && $(window).off('resize', this.resize);

                // 销毁该组件下的所有弹出窗口
                _(this._windows).each(function (window) {
                    window.destroy();
                });

                // 销毁该视图的所有子视图
                this._destroyView();

                // 销毁该组件下的kendo控件
                if (window.kendo) {
                    _.each(this.$('[data-role]'), function (el) {
                        var inst = kendo.widgetInstance($(el));
                        inst && inst.destroy();
                    });
                }

                kendo.unbind(this.$el);
                this.viewModel = null;

                this.options.sandbox.log('destroyed');
            },
            destroy: function () {
                this._destroy();
            }
        };
    };

    return base;
});
