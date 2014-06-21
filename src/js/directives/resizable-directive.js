angular.module('winbehat').directive('resizable', function () {
    return {
        restrict: 'A',
        link: function postLink(scope, elem, attrs) {
            elem.resizable({handles: 'e', minWidth: 20});
        }
    };
});