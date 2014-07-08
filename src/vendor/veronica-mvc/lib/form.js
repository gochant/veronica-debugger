define(function () {

    var form = function (app) {
        var $ = app.sandbox.$;
        var _ = app.sandbox._;

        return {
            type: 'form',  // 视图类型
            validation: {},  // 自定义验证
            parentWnd: null,
            defaults: {   // 默认数据
                id: null,
                url: {
                    read: '',  // 获取表单数据
                    defaults: '',  // 获取表单默认数据
                    add: '',  // 新增数据
                    modify: ''  // 修改数据
                },
                data: {},
                autoRead: true,
                schema: null,  // 前后台数据映射
                params: function () {  // 获取数据时传递参数
                    return {};
                },
                state: 'add'  // 表单状态，是新增还是编辑（'add' 和 'edit'）
            },
            errorTemplate: '<span class="k-widget k-tooltip k-tooltip-validation k-invalid-msg" ' +
                        'data-for="#= name #" role="alert" title="#= message #">' +
                        '<i class="fa fa-exclamation-circle"></i></span>',
            submitConfig: function (url, data) {
                // 针对ASP.NET MVC 3的数据提交方式，必须手动进行数据的序列化
                return {
                    url: url,
                    type: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    data: JSON.stringify(data)
                };
            },
            init: function () {
                this.validator = this.$el.kendoValidator(_.extend({
                    // 自定义的错误验证方式
                    errorTemplate: this.errorTemplate
                }, this.validation)).data('kendoValidator');

                this.listenTo(this, 'rendered', function () {
                    var $wnd = this.$el.closest('.fn-wnd');
                    if ($wnd.length > 0) {
                        this.parentWnd = this.instance($wnd)
                    }

                    this.options.autoRead && this.read();
                });

                this.listenTo(this, 'modelBound', function () {
                    this.validator.hideMessages();
                });

                // 如果在对话框内，保存完毕后关闭对话框
                this.listenTo(this, 'saved', function () {
                    this.options.parentWnd && this.options.parentWnd.close();
                });

            },
            // 读取表单数据，返回延迟对象
            read: function () {
                var urlName = this.options.state === 'add' ? 'defaults' : 'read';
                var url = this.options.url[urlName];
                var me = this;
                var isLocal = url ? false : true;
                if (isLocal) {
                    var dtd = $.Deferred();
                    me.model({ data: this.options.data || {} });
                    dtd.resolve();
                    return dtd.promise();
                } else {
                    var params = this.options.params.call(this);
                    kendo.init(this.$el);
                    return $.getJSON(url, $.extend({ id: this.options.id }, params))
                        .done(function (resp) {
                            if (!resp.success) return;
                            var respData = me._process(resp.data);
                            var data = {};
                            var schema = me.options.schema;
                            if (schema) {
                                if (_.isFunction(schema)) {
                                    data = (_.bind(schema, me))(respData, 'read');
                                } else {
                                    _.each(schema, function (value, key) {
                                        data[key] = respData[value];
                                    });
                                }
                                data = data.data ? data : { data: data };
                            } else {
                                data = { data: respData };
                            }
                            me.model(data);
                        });
                }

            },
            // 处理ASP.NET JSONResult 日期类型值
            _process: function (data) {
                var me = this;
                _(data).each(function (value, key) {
                    if (_.isString(value) && value.indexOf('/Date(') > -1) {
                        data[key] = new Date(parseInt(value.replace("/Date(", "").replace(")/", ""), 10));
                    }
                    if (_.isObject(value)) {
                        data[key] = me._process(value);
                    }
                });
                return data;
            },
            //   _serverErrors
            // 重置
            reset: function () {
                this.read();
            },
            // 保存
            save: function () {
                var me = this;
                if (this.validate()) {
                    var respData = this.model().get('data').toJSON();
                    var urlName = this.options.state === 'add' ? 'add' : 'modify';
                    var url = this.options.url[urlName];
                    var isLocal = url ? false : true;
                    var schema = me.options.schema;
                    respData = schema ? (_.bind(schema, me))(respData, 'save') : respData;
                    if (isLocal) {
                        me.trigger('saved', respData, isLocal, this.options.state);
                    } else {
                        $.ajax(this.submitConfig(url, respData)).done(function (resp) {
                            if (resp.success) {
                                me.trigger('saved', resp, isLocal, me.options.state);
                            } else {
                                // 解析错误消息
                                if (_.isArray(resp.data)) {
                                    var errorTpl = kendo.template(me.errorTemplate);
                                    _.each(resp.msg, function (msg) {
                                        var $input = me.$('[name=' + msg.Key + ']');
                                        if ($input.length > 0) {
                                            $input.addClass('k-invalid');
                                            $input.after(errorTpl({ name: msg.Key, message: msg.Errors.join('<br>') }));
                                        }
                                    })
                                }
                            }
                        });
                    }
                }
            },
            validate: function () {
                var result = [];
                var valid;
                if (this.validator) {
                    result.push(this.validator.validate());
                }
                // 调用子视图的验证方法
                _.each(this._views, function (view) {
                    if (view.validate) {
                        result.push(view.validate());
                    }
                });
                valid = _.every(result, _.identity);
                this.trigger('validate', valid);
                return valid;
                // 获取错误数： this.validator.errors.length
            }
        };
    };

    return form;

});