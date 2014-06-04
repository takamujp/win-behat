angular.module('winbehat').factory('highlighService', function () {
    return {
        highlight: function (path) {
            $('.highlight').removeClass('highlight');
            $("pre[path=\"" + path.replace(/\\/g, '\\\\') + "\"]").addClass('highlight');
        }
    };
});

