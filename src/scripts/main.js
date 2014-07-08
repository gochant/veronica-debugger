requirejs.onError = function (err) {
    console.log(err.requireType);
    if (err.requireType === 'timeout') {
        alert('modules: ' + err.requireModules);
    }
    if (err.requireType === 'scripterror') {
        alert('script error');
    }

    throw err;
};
requirejs(['./config/require-conf'], function (conf) {

    // requirejs 配置
    requirejs.config(conf());

    requirejs(['app']);

})
