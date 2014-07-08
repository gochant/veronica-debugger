define([], function () {
    //  更改 $grid 为方法
    return function (app) {
        var _ = app.core._;
        return {
            _filter: [],
            GRID_CLASS: '.grid',

            defaults: {
                filters: [],  // 传递方法
                isLocal: false,
                url: {
                    read: '',
                    remove: ''
                },
                columns: [],// 列集合
                chkTemplate: {// 全选模板
                    headerTemplate: '&nbsp;',
                    template: '<input name=\"selectedIds\" class=\"chk"\ type=\"checkbox\" />',
                    width: 30
                },
                wndOptions: {},
                blankContent: '未找到结果！',
                enableChk: false // 启用全选功能 (openChk)
            },
            events: {
                // 搜索
                'keyup .search': function (e) {
                    if (e.keyCode === 13) {
                        var value = $(e.target).val();
                        this.search(value);
                    }
                },
                // 复选框
                'change .chk': function (e) {
                    var $target = $(e.target);
                    var $tr = $target.closest('tr');
                    var checked = $target.is(':checked');
                    var grid = this.instance(this.$grid());
                    checked ? grid.selectable.value($tr) : grid.selectable._unselect($tr);

                }
            },
            resize: function () {
                this.adjustGridSize(this.$grid());
            },
            initAttr: function () {
                var cols = [];
                var me = this;
                this.options.enableChk && cols.push(this.options.chkTemplate);
                this.options.columns = this._createColumns(cols.concat(this.options.columns));
                this.model({
                    columns: this.options.columns,  // 表格列
                    source: this.options.source != null ? this.options.source() :
                        app.mvc.baseServerSource(this.options.url.read),  // 表格数据源
                    total: function () {  // 表格的总数
                        return this.get('source').total();
                    },
                    gridDataBound: function (e) {
                        me._blank(e.sender);
                    }
                }, false);
            },
            $grid: function () {
                return this.$(this.GRID_CLASS);
            },
            grid: function () {
                return this.instance(this.$grid());
            },
            listenSelf: function () {
                this.listenTo(this, 'modified', function (isLocal) {
                    if (!isLocal) {
                        this.filter();
                    }
                });
                this.listenTo(this, 'modelBound', function () {
                    var me = this;
                    this.grid().bind('change', function () {
                        if (me.options.enableChk) {
                            me._setCheckboxState();
                        }
                    });

                    this.filter();
                });
                this.listenToDelay('editView', 'saved', function (isLocal, state, data) {
                    if (isLocal && state === 'add') {
                        this.source().insert(0, data);
                    }
                    this.trigger('modified', isLocal);
                });
            },
            _setCheckboxState: function () {
                var $allRows = this.$grid().find('tbody tr[role=row]');
                var $selectedRows = this.grid().select();
                _($allRows).each(function (row) {
                    var state = _.isUndefined(
                        _($selectedRows).find(function (value) {
                            return $(row).data().uid === $(value).data().uid
                        })) ? false : true;

                    $(row).find('.chk').prop('checked', state);
                });
            },
            edit: function (editView, id) {
                this._generateEditWnd(editView, id);
            },
            _generateEditWnd: function (editView, id) {
                var name = this.options.langClass == null ? '数据' : app.lang[this.options.langClass].g;

                var conf = _.isUndefined(id) ? {
                    state: 'add',
                    title: '增加新' + name
                } : {
                    state: 'edit',
                    title: '修改' + name + '信息'
                };

                this.window($.extend({
                    name: 'wndAdd',
                    type: 'view',
                    options: {
                        title: conf.title
                    },
                    viewOpt: {
                        name: 'editView',
                        instance: editView,
                        options: {
                            id: id,
                            // 如果是本地数据源，则传递给编辑对话框
                            data: (this.options.isLocal && id) ? this.source().get(id) : {},
                            state: conf.state
                        }
                    }
                }, this.options.wndOptions));

            },
            // 创建列
            _createColumns: function (cols) {
                var useLang = this.options.langClass == null ? false : true;

                return _.map(cols, function (col) {
                    var title;
                    if (useLang) {
                        var lang = app.lang[this.options.langClass];
                        title = lang[col];
                    } else {
                        title = col.title ? col.title : (col.field ? col.field : col);
                    }
                    if (_.isString(col)) {
                        return {
                            field: col,
                            title: title
                        };
                    } else {
                        return col;
                    }
                });
            },
            // 获取选择的ID
            getSelectedId: function () {
                var dataItem = this.getSelectedItem();
                return dataItem === null ? dataItem : dataItem.id;
            },
            // 获取选择的行
            getSelectedItem: function () {
                var grid = this.grid();
                var items = _.map(grid.select(), function (el) {
                    return grid.dataItem($(el));
                });
                return items.length === 0 ? null : (items.length === 1 ? items[0] : items);
            },
            // filter data
            filter: function (filter, isGroup) {
                var source = this.source();
                if (_.isUndefined(filter)) {
                    source.read();
                } else {
                    // 判断是否是已存在的filter
                    var isExist = _(filter).every(function (f) {
                        return _(this._filter).some(function (ff) {
                            return _.isEqual(f, ff);
                        })
                    })

                    if (isExist) return;

                    if (_.isUndefined(isGroup)) {
                        isGroup = true;
                    }
                    if (isGroup) {
                        this._filter = _.uniq(filter.concat(this._filter), function (f) {
                            return f.field;
                        });
                    } else {
                        if (_.isFunction(this.options.filters)) {
                            this._filter = _.uniq(filter.concat(this.options.filters()), function (f) {
                                return f.field;
                            });
                        } else {
                            this._filter = filter;
                        }
                    }

                    source.filter(filter);
                }
            },
            source: function () {
                return this.viewModel.get('source');
            },
            _blank: function (grid) {
                var $grid = grid.element;
                var source = grid.dataSource;
                var content = this.options.blankContent;
                // 列数
                var colCount = $grid.find('.k-grid-header colgroup > col').length;

                if (source._view.length == 0) {
                    $grid.find('.k-grid-content tbody')
                        .append('<tr class="kendo-data-row blank-placeholder"><td colspan="' +
                            colCount + '"><div>' + content + '</div></td></tr>');
                }

                var rowCount = $grid.find('.k-grid-content tbody tr').length;
                if (rowCount < source._take) {
                    var addRows = source._take - rowCount;
                    for (var i = 0; i < addRows; i++) {
                        $grid.find('.k-grid-content tbody')
                            .append('<tr class="kendo-data-row"><td>&nbsp;</td></tr>');
                    }
                }
            },
            // 刷新
            refreshHandler: function () {
                this.$('.search').val('');
                this.filter({}, false);
            },
            // 删除
            deleteHandler: function () {
                var me = this;
                this.getSelectedId() === null ?
                    window.alert('请选择一条数据') : (function () {
                    if (window.confirm('确定删除这条数据？')) {
                        me.trigger('modified');
                    }
                })();
            },
            // 搜索
            search: function (value) {
                if (value) {
                    this.filter([
                        { field: "key", operator: "eq", value: value }
                    ])
                }
            },
            adjustGridSize: function (gridEl) {
                if (gridEl && gridEl.is(':visible')) {
                    var newHeight = gridEl.innerHeight(),
                        otherElements = gridEl.children().not(".k-grid-content"),
                        otherElementsHeight = 0;

                    otherElements.each(function () {
                        otherElementsHeight += $(this).outerHeight();
                    });

                    gridEl.children(".k-grid-content").height(newHeight - otherElementsHeight);
                }
            }
        };
    };
});
