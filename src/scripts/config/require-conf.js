// requirejs
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(function () {
            return factory();
        });
    } else if (typeof exports === 'object') {
        // Node.js
        module.exports = factory();
    } else {
        // Browser globals
        root.ReqConfig = factory();
    }
}(this, function () {

    return function (framePath) {
        framePath || (framePath = '../vendor');
        return {
            debug: true,
            appDir: './src',
            baseUrl: "scripts",
            dir: './public',
            paths: {
                'underscore': framePath + '/underscore/underscore',
                'jquery': framePath + '/jquery/jquery',
                'eventemitter': framePath + '/eventemitter2/lib/eventemitter2',
                'backbone': framePath + '/backbone/backbone',

                'text': framePath + '/requirejs-text/text',
                'css': framePath + '/require-css/css',
                'normalize': framePath + '/require-css/normalize',
                'css-builder': framePath + '/require-css/css-builder'
            },
            shim: {
                'underscore': { 'exports': '_' },
                'jquery': { 'exports': 'jquery' },
                'backbone': { deps: ['underscore', 'jquery'], 'exports': 'Backbone' }
            },
            packages: [{
                name: 'veronica',
                location: framePath + '/veronica/lib'
            }, {
                name: 'veronica-mvc',
                location: framePath + '/veronica-mvc/lib'
            }, {
                name: 'kendo-ui',
                location: framePath + '/kendo-ui/src/js', main: 'kendo.ui.core'
            }],
            sources: {
                'default': '../widgets'
            },
            combine: [],
            buildPaths: {},
            cdn: [],
            controls: []
        };
    }

}));
