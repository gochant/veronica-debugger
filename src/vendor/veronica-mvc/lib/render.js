define([
    'sprintf'
], function (sprintf) {

    var formTpls = {
        group: '<fieldset><legend>%s</legend>%s</fieldset>',
        formGroup: '<div class="form-group">%s</div>',
        label: '<label class="control-label %s">%s</label>',

        text: '<input type="text" class="form-control" name="%s" %s />',
        date: '<input type="date" data-role="datepicker" name="%s" %s />',
        dropdownlist: '<select data-role="dropdownlist" name="%s" %s ></select>',
        textarea: '<textarea cols="" rows="4" class="form-control" name="%s" %s></textarea>'
    }
    var tableTpls = {
        table: '<table class="table">%s</table>',
        thead: '<thead><tr>%s</tr></thead>',
        tbody: '<tbody data-role="listview" data-auto-bind="false" data-bind="%s" %s></tbody>'
    }

    return function (app) {

        var _ = app.core._;
        app.print = sprintf;

        var vsprintf = sprintf.vsprintf;

        _.mixin({
            renderForm: function (config, tpls) {
                tpls = _.extend({}, formTpls, tpls);
                var html = '';
                _.each(config, function (group) {
                    var cnt = '';
                    var type = group[1];
                    var title = group[0];
                    var members = group[3];
                    var layout = group[2];
                    var inputs = [];

                    _.each(layout, function (ly) {
                        var fg = '';
                        var ctlLen = (12 - 2 * ly) / ly;
                        while (ly > 0) {
                            var member = members.shift();
                            var label = member[0];
                            var field = member[1];
                            var type = member[2] === '$$' ? 'text' : member[2];
                            var bind = member[3] === '$$' ? 'value: data.' + field : member[3];
                            var attr = member[4] === undefined ? '' : member[4];

                            fg += vsprintf(tpls['label'], ['col-sm-2', label])
                                + vsprintf('<div class="col-sm-%s">%s</div>'
                                , [ctlLen, vsprintf(tpls[type], [field, 'data-bind="' + bind + '" ' + attr])]);
                            ly--;
                        }
                        cnt += vsprintf(tpls['formGroup'], [fg]);
                    });
                    if (type === '$$' || type === 'group') {
                        cnt = '<fieldset><legend>' + title + '</legend>' + cnt + '</fieldset>';
                    }
                    if (cnt !== '') {
                        html += cnt;
                    }
                });
                return html;
            },
            renderTable: function (config, tpls) {
                tpls = _.extend({}, tableTpls, tpls);
                var thead = '';
                var tr = '';
                var tpls = tableTpls;
                var bind = config.bind;
                var attr = config.attr === '$$' ? '' : config.attr;
                _.each(config.columns, function (column) {
                    var title = column[0];
                    var field = column[1];
                    thead += '<th>' + title + '</th>';
                    tr += '<td>#= ' + field + '#</td>';
                });
                config.template = '<tr>' + tr + '</tr>';

                return vsprintf(tpls.table, [vsprintf(tpls.thead, [thead]) + vsprintf(tpls.tbody, [bind, attr])]);
            }
        });
    };

});