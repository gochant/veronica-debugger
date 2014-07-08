define(function () {

    return function (app) {
        var _ = app.core._;
        var kendo = app.core.kendo;
        var result = {};

        // 基础模型
        result.baseModel = function (options) {
            if (_.isString(options)) {
                options = {
                    id: options || "ID"
                };
            }
            return kendo.data.Model.define(options);
        };

        // 基础数据源
        result.baseSource = function (url) {
            var param;
            if (_.isString(url)) {
                param = {
                    pageSize: 20,
                    page: 1,
                    schema: {
                        model: app.mvc.baseModel('ID'),
                        type: 'json',
                        data: 'data',
                        total: 'total'
                    },
                    transport: {
                        read: {
                            url: url,
                            dataType: 'json'
                        }
                    }
                }
            } else {
                param = url;
            }

            return new kendo.data.DataSource(param);
        };

        result.baseLocalSource = function (options) {
            return new kendo.data.DataSource(options);
        };

        result.baseServerSource = function (url) {
            return new kendo.data.DataSource({
                pageSize: 20,
                page: 1,
                serverPaging: true,
                serverSorting: true,
                serverFiltering: true,
                schema: {
                    //type: 'json',
                    data: 'data',
                    total: 'total'
                },
                transport: {
                    read: {
                        url: url,
                        type: 'POST',
                        dataType: "json",
                        contentType: "application/json; charset=utf-8"
                    },
                    parameterMap: function (data, type) {
                        if (type === "read") {
                            return JSON.stringify(data);
                        }
                        return data;
                    }
                }
            });
        };

        // 基础视图模型
        result.baseViewModel = function (obj) {
            return kendo.observable(obj);
        };

        return result;
    };
});
