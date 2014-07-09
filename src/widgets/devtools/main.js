define([
    'text!./templates/index.html',
    'css!./styles/index'
], function (tpl) {

    return function (options) {
        var app = options.sandbox.app;
        var sandbox = options.sandbox;
        var $ = app.core.$;
        var _ = app.core._;

        var View = app.mvc.baseView({
            template: tpl,
            defaults: {
                autoAction: true
            },
            initAttr: function () {
                var me = this;
                this.baseModel = {
                    currWidgetIndex: 0,
                    currViewIndex: 0,
                    currView: null,
                    widgetCount: 0,
                    currWidgetViews: [],
                    onWidgetChange: function (e) {
                        this.set('currWidgetIndex', e.sender.select().index());
                        this.set('currWidgetViews', this.get('data.widgetInfos')[this.get('currWidgetIndex')].get('views'));
                        me.instance('.view-list').select(me.$('.view-list').children().first());
                    },
                    onViewChange: function (e) {
                        this.set('currViewIndex', e.sender.select().index());
                        this.set('currView', this.get('currWidgetViews')[this.get('currViewIndex')]);
                    }
                };
                this.model({
                    data: {}
                }, false);
            },
            subscribe: function () {
                var me = this;
                this.sub('modify', function (data) {
                    if (data.type === 'addWidget') {
                        me.model().get('data.widgetInfos').push(data.data);
                        me.instance('.widget-list').select(me.$('.widget-list').children().first());
                    }
                    if (data.type === 'removeWidget') {
                        var widgets = me.model().get('data.widgetInfos');
                        var that = this, idx, length, removeIdx;
                        for (idx = 0, length = widgets.length; idx < length; idx++) {
                            if (widgets[idx].ref === data.data) {
                                removeIdx = idx;
                            }
                        }
                        removeIdx = -1;

                        widgets.splice(removeIdx, 1);

                        me.instance('.widget-list').select(me.$('.widget-list').children().first());
                    }
                });
            },
            addViewHandler: function () {
                this.model().get('data.widgetInfos[0].views').push({
                    name: 'view23',
                    isMain: false,
                    instance: {},
                    subViews: ['view14', 'view15'],
                    subWindows: ['wnd16', 'wnd17'],
                    subWidgets: ['widget8', 'widget9']
                })
            },
            reloadHandler: function () {
                app.reloadPage();
            },
            refreshHandler: function () {
                var me = this;
                chrome.devtools.inspectedWindow.eval("window.__veronicaAgent.getAppInfo()", function (appInfo) {
                    me.model({ data: appInfo });
                    me.model().set('widgetCount', appInfo.widgetInfos.length);
                    me.instance('.widget-list').select(me.$('.widget-list').children().first());
                });
            },
            reportViewHandler: function (e) {
                var prop = $(e.target).data().name;
                var widx = this.model().get('currWidgetIndex');
                var vidx = this.model().get('currViewIndex');
                var winfo = this.model().get('data.widgetInfos')[widx];
                var wref = winfo.ref;
                var vref = '';
                if (vidx !== 0) vref = wref.views[vidx].ref;

                chrome.devtools.inspectedWindow.eval('window.__veronicaAgent.reportView("' + wref + '", "' + vref + '", "' + prop + '")');
            },
            reportAppHandler: function (e) {
                var prop = $(e.target).data().name;
                chrome.devtools.inspectedWindow.eval('window.__veronicaAgent.reportApp("' + prop + '")');
            }
        });

        return new View(options);
    };
});