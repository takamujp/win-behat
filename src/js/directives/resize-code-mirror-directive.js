angular.module('winbehat').directive("resizeCodeMirror", function ($window) {
    return function ($scope) {
        var editor_tabs = document.querySelector('#editor-tabs');
        
        $scope.windowHeight = 0;
        $scope.windowWidth = 0;
        $scope.initializeWindowSize = function () {
            $scope.windowHeight = $window.innerHeight - editor_tabs.clientHeight;
            $scope.windowWidth = $window.innerWidth;
        };
        $scope.initializeWindowSize();
        
        $scope.$watchCollection('editFilelist', function () {
            $scope.initializeWindowSize();
        });
        
        angular.element($window).bind('resize', function () {
            $scope.initializeWindowSize();
            return $scope.$apply();
        });
        
        angular.element($window).bind('changeTab', function () {
            $scope.initializeWindowSize();
        });
    };
});