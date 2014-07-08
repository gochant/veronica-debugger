define(function () {

    return function (app) {
        var _ = app.sandbox._;
        // 延迟页面切换
        var _changePage = _.throttle(function (page) {
            app.switchPage(page);
        }, 500);

        var router = {

            routes: {
                '': 'entry',
                "page/:page": "openPage"
            },
            entry: function () {
                this.openPage('home');
            },
            _openPage: _changePage,
            openPage: _changePage

        };
        return router;
    };
});
