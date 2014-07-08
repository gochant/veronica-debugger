// mvc 扩展
define([
    './data',
    './base',
    './source',
    './list',
    './form',
    './router',
    './hash',
    './templates',
    'kendo-ui',
    'backbone'
], function (data, base, source, list, form, router, hash) {

    return function (app) {
        var $ = app.core.$;
        var _ = app.core._;

        app.core.kendo = kendo;
        app.core.Backbone = Backbone;

        app.mvc = {};  // 提供MVC框架扩展

        app.lang = {};

        app.hash = hash;

        app.data = data(app);

        app.core.util.extend(app.mvc, source(app));


        app.mvc._baseView = base(app);
        app.mvc.baseView = function (obj) {
            return Backbone.View.extend($.extend(true, {}, app.mvc._baseView, obj));
        };

        app.mvc._formView = form(app);
        app.mvc.formView = function (obj) {
            return Backbone.View.extend($.extend(true, {}, base(app), app.mvc._formView, obj));
        };

        app.mvc._listView = list(app);
        app.mvc.listView = function (obj) {
            return Backbone.View.extend($.extend(true, {}, base(app), app.mvc._listView, obj));
        };

        app.mvc._router = router(app);
        app.mvc.Router = function (obj) {
            obj || (obj = {});
            return Backbone.Router.extend($.extend(true, {}, app.mvc._router, obj));
        };
        app.startRouter = function (obj) {
            app.mvc.router = new (app.mvc.Router(obj))();
            Backbone.history.start({ pushState: false });
        };

        // 布局切换时，清除kendo的实例
        app.sandbox.on('layoutSwitching', function (layout, appName) {
            if (appName === app.name) {
                _.each($('.page-view').find('[data-role]'), function (el) {
                    var inst = kendo.widgetInstance($(el));
                    if (inst) {
                        inst && inst.destroy();
                    }
                });
            }

        });

    };
})
