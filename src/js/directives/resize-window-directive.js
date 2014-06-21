angular.module('winbehat').directive('resizeWindow', function ($window) {
    return function ($scope) {
        var editor_tabs = document.querySelector('#editor-tabs');
        
        $scope.windowHeight = 0;
        $scope.windowWidth = 0;
        $scope.editorHeight = 0;
        $scope.menuHeight = 0;
        $scope.editorWidth = 0;
        $scope.editorLeft = 240;
        $scope.initializeWindowSize = function () {
            $scope.windowHeight = $window.innerHeight;
            $scope.windowWidth = $window.innerWidth;
            $scope.editorLeft = $('#directory-tree').width();
            $scope.editorHeight = $window.innerHeight - editor_tabs.clientHeight - 28;
            $scope.editorWidth = $scope.windowWidth - $scope.editorLeft;
            $scope.menuHeight = $window.innerHeight - 28;
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
