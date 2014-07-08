define(function () {

    return function (app) {
        var _ = app.core._;
        var kendo = app.core.kendo;

        kendo.data.binders.widget.template = kendo.data.Binder.extend({
            refresh: function () {
                var widget = this.element;
                widget.setOptions({
                    template: this.bindings.template.get()
                });
            }
        });

        return {
            _filter: [],
            LIST_CLASS: '[data-role=listview]',
            filter: function (filter, isGroup) {
                if (this.options.filterAbort()) return;
                var source = this.source();
                var baseFilter = _.isFunction(this.options.filters) ? this.options.filters() : [];

                if (_.isUndefined(filter)) {
                    source.filter(baseFilter);
                } else {
                    if (_.isEmpty(filter)) {
                        this._filter = [];
                    } else {
                        if (!_.isArray(filter)) {
                            filter = [filter];
                        }

                        // 判断是否与当前活动的filter相同
                        var isExist = _(filter).every(function (f) {
                            return _(this._filter).some(function (ff) {
                                return _.isEqual(f, ff);
                            })
                        })

                        if (isExist) return;

                        if (_.isUndefined(isGroup)) { isGroup = false; }
                        if (isGroup) { baseFilter = this._filter };

                        this._filter = _.uniq(filter.concat(baseFilter), function (f) {
                            return f.field;
                        });
                    }

                    source.filter(this._filter);
                }
            },
            list: function () {
                return this.instance(this.$list());
            },
            $list: function () {
                return this.$(this.LIST_CLASS);
            },
            // 获取选择的ID
            getSelectedId: function () {
                var dataItem = this.getSelectedItem();
                if (_.isArray(dataItem)) {
                    return _.map(dataItem, function (item) {
                        return item.id;
                    })
                }
                return dataItem === null ? dataItem : dataItem.id;
            },
            // 获取选择的行
            getSelectedItem: function () {
                var list = this.list();
                var source = this.source();
                var items = _.map(list.select(), function (el) {
                    if (list.dataItem) {
                        return list.dataItem($(el));
                    } else {
                        return source.getByUid($(el).data().uid);
                    }
                });
                return items.length === 0 ? null : (items.length === 1 ? items[0] : items);
            },
            source: function () {
                return this.viewModel.get('source');
            },
            refresh: function () {
                this.filter({}, false);
            }
        };
    };
});
