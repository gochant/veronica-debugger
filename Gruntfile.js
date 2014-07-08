'use strict';

module.exports = function (grunt) {
    var pkg = grunt.file.readJSON('package.json');
    var _ = require('underscore');
    var path = require('path');
    var reqConf = require(pkg.publish.config)();
    var emptyPaths = {};

    _.each(reqConf.paths, function (item, name) {
        if (!_.contains(['text', 'css', 'normalize', 'css-builder'], name)) {
            emptyPaths[name] = 'empty:';
        }
    });

    _.each(reqConf.packages, function (item, name) {
        emptyPaths[item.name] = 'empty:';
    });

    var controlsPath = {};
    _.each(reqConf.controls, function (control) {
        control = control.split('@')[0];
        controlsPath[control] = 'empty:';
        controlsPath[control + '/main'] = control + '/main';
        controlsPath[control + '/styles'] = control + '/styles';
        controlsPath[control + '/views'] = control + '/views';
        controlsPath[control + '/templates'] = control + '/templates';
    });

    // 获取部件目录下的模块（当前源路径，所有源路径）
    var getModules = function (opt, widgets) {

        if (!opt) {
            return [];
        }
        var source = opt.source || grunt.option('source');
        var fs = require('fs');
        var dirs = fs.readdirSync(source);

        var subSource = [];
        _.each(widgets, function (sr) {
            var idx = sr.source.indexOf(opt.source);
            if (idx >= 0 && opt.source !== sr.source) {
                subSource.push(sr.source.substring(idx + opt.source.length + 1));
            }
        });

        var result = _.map(_.reject(dirs, function (dir) {
            // 排除特殊的文件（夹）名称和其他包路径名称
            return _.find(['.css', '.js', '.DS_Store', 'styles'].concat(subSource), function (tag) {
                return dir.indexOf(tag) > -1;
            });
        }), function (dir) {

            return {
                name: dir + '/main',
                exclude: ['text', 'css']
            };
        });
        return result;
    };

    // 工程配置
    grunt.initConfig({
        // 元数据
        pkg: pkg,
        // 任务配置
        requirejs: {
            site: {
                options: {
                    appDir: reqConf.appDir,
                    baseUrl: reqConf.baseUrl,
                    dir: reqConf.dir,
                    modules: [
                        { name: 'main', include: ['app', 'veronica-mvc'] }
                    ],
                    paths: reqConf.paths,
                    shim: reqConf.shim,
                    packages: reqConf.packages,
                    // optimize: "none",  // uglify
                    optimize: "uglify",
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName.indexOf('require-conf') > -1) {
                            return contents.replace(/debug\s*\:\s*(true|false)/g, 'debug: false, optimized: true');
                        }
                        return contents;
                    },
                    preserveLicenseComments: false,
                    removeCombined: true,
                    fileExclusionRegExp: /^\./
                }
            },
            page: {

            },
            widget: {
                options: {
                    baseUrl: grunt.option('source'), // "./base/ui/widgets"
                    dir: grunt.option('target'), // './base/public/widgets'
                    modules: getModules(),
                    paths: _.extend({}, controlsPath, emptyPaths, grunt.option('path')),
                    shim: reqConf.shim,
                    optimize: "uglify", // uglify2
                    // optimizeCss: "none",
                    removeCombined: true,
                    preserveLicenseComments: false,
                    fileExclusionRegExp: /^\./,
                    onBuildWrite: function (moduleName, path, contents) {
                        var packageName = moduleName.substring(0, moduleName.indexOf('/main'));
                        return contents + "\ndefine('" + packageName + "', ['" + moduleName + "'], function (main) { return main; })";
                    }

                }
            }
        },

        concat: {
            options: {
                separator: '\n'
            }
        },
        copy: {
            main: {
            }
        },
        clean: {
            // TODO: 这里写死了一些路径，需考虑一种更优雅的方式
            main: [
                'public/**/*.less',
                'public/**/build.txt',
                'public/scripts/layouts'
            ],
            vendor: [
                'public/vendor/backbone',
                'public/vendor/eventemitter2',
                'public/vendor/jquery',
                'public/vendor/pnotify',
                'public/vendor/underscore',
                'public/vendor/veronica',
                'public/vendor/veronica-mvc'
            ],
            source: [
                'frontend'
            ]
        },
        css_combo: {
            main: {
                files: {
                    'public/styles/index.css': ['public/styles/index.css']
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
   // grunt.loadNpmTasks('grunt-css-combo');

    grunt.registerTask('site', ['requirejs:site']);
    // 打包单个插件包
    grunt.registerTask('widget', ['requirejs:widget']);
    // 打包所有插件包
    grunt.registerTask('widgets', function () {
        var widgets = _.map(reqConf.sources, function (item) {
            return {
                source: path.join(reqConf.appDir, reqConf.baseUrl, item),
                target: path.join(reqConf.dir, reqConf.baseUrl, item)
            };
        })

        _.each(widgets, function (opt, i) {
            var modules = getModules(opt, widgets);
            var widgetsPath = {};

            // 解析以下几个文件相对于部件文件夹的正确路径
            _.each(['text', 'css', 'normalize', 'css-builder'], function (mod) {
                var modPath = reqConf.paths[mod];
                var truthPath = path.join(reqConf.appDir, reqConf.baseUrl, modPath);
                var dep = 10;
                while (truthPath !== path.join(opt.source, modPath) && dep !== 0) {
                    modPath = path.join('../', modPath);
                    dep--;
                }
                widgetsPath[mod] = modPath;
            });
            grunt.config('requirejs.widget' + i, {
                options: _.extend(grunt.config('requirejs.widget.options'), {
                    baseUrl: opt.source,
                    dir: opt.target,
                    paths: _.extend({}, controlsPath, emptyPaths, widgetsPath, reqConf.buildPaths || {}),
                    modules: modules
                })
            });
            grunt.config('concat.widget' + i, {
                src: [opt.source + '/**/*.css', '!' + opt.source + '/**/*.min.css'],
                dest: opt.target + '/styles/all.css'
            });

            //grunt.config('copy.widget' + i, {
            //    expand: true,
            //    src: opt.source + '/**/images/**',
            //    dest: opt.target + '/images/',
            //    flatten: true,
            //    filter: 'isFile'
            //})

            grunt.config('clean.widget' + i, {
                src: [
                    opt.target + '/**/templates/',
                    opt.target + '/*/**/styles/',
                    opt.target + '/**/build.txt',
                    opt.target + '/**/css.js',
                    opt.target + '/**/css-builder.js',
                    opt.target + '/**/normalize.js',
                    opt.target + '/**/text.js',
                    opt.target + '/*/**/images/'
                ]
            })

            // 压缩该目录下所有插件
            grunt.task.run('requirejs:widget' + i);
            // 合并该目录下所有CSS文件（解决在IE下31个样式表限制问题）
            grunt.task.run('concat:widget' + i);
            // 拷贝图片
            // grunt.task.run('copy:widget' + i);
            // 清理
            grunt.task.run('clean:widget' + i);

        });
    });

    grunt.registerTask('pages', function () {
        var pages = reqConf.pages || [];
        _.each(pages, function (page, index) {
            var pageReqConf = require(page + '/scripts/config/require-conf.js')();
            grunt.config('requirejs.page' + index, {
                options: {
                    appDir: pageReqConf.appDir,
                    baseUrl: pageReqConf.baseUrl,
                    dir: pageReqConf.dir,
                    modules: [
                        { name: 'main', include: pageReqConf.combine || [] }
                    ],
                    paths: pageReqConf.paths,
                    shim: pageReqConf.shim,
                    packages: pageReqConf.packages,
                    // optimize: "none",  // uglify
                    optimize: "uglify",
                    uglify: {

                    },
                    removeCombined: true,
                    fileExclusionRegExp: /^\./
                }
            });
            grunt.task.run('requirejs:page' + index);
        });
    });

    grunt.registerTask('default', function () {
        grunt.task.run('site');
        grunt.task.run('widgets');
        // grunt.task.run('pages');
      //  grunt.task.run('css_combo');
        grunt.task.run('clean:main');
        grunt.task.run('clean:vendor');
    });

    grunt.registerTask('publish', function () {
        grunt.task.run('default');
        grunt.task.run('clean:source');

    });
};