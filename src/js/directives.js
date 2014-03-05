angular.module('winbehat').directive('context', function () {
  var contexts = [];
  var hide = function () {
    for (var key in contexts) {
      contexts[key].css({ 'display': 'none' });
    }
  };
  return {
    restrict: 'A',
    scope: '@&',
    compile: function compile(tElement, tAttrs, transclude) {
      return {
        post: function postLink(scope, iElement, iAttrs, controller) {
          var ul = $('#' + iAttrs.context), last = null;
          ul.css({ 'display': 'none' });
          contexts[iAttrs.context] = ul;
          $(iElement).on('contextmenu', function (event) {
            angular.element($('#directory-tree')).scope().contextTarget = scope.file.children[scope.$index];
            hide();
            ul.css({
              position: 'fixed',
              display: 'block',
              left: event.clientX + 'px',
              top: event.clientY + 'px'
            });
            last = event.timeStamp;
            event.stopPropagation();
          });
          $(document).on('click contextmenu', function (event) {
            var target = $(event.target);
            if (!target.is('.popover') && !target.parents().is('.popover')) {
              if (last === event.timeStamp) {
                return;
              }
              ul.css({ 'display': 'none' });
            }
          });
        }
      };
    }
  };
});angular.module('winbehat').directive('dirctoryTreeNode', [
  '$compile',
  function ($compile) {
    return {
      restrict: 'E',
      replace: true,
      scope: { file: '=' },
      templateUrl: 'template/directory-tree-node.html',
      controller: 'directoryTreeController',
      compile: function (element) {
        var contents = element.contents().remove();
        var compiled;
        return function (scope, element) {
          if (!compiled) {
            compiled = $compile(contents);
          }
          compiled(scope, function (clone) {
            element.append(clone);
          });
        };
      }
    };
  }
]);angular.module('winbehat').directive('resizeWindow', [
  '$window',
  function ($window) {
    return function ($scope) {
      var editor_tabs = document.querySelector('#editor-tabs');
      $scope.windowHeight = 0;
      $scope.windowWidth = 0;
      $scope.editorHeight = 0;
      $scope.menuHeight = 0;
      $scope.initializeWindowSize = function () {
        $scope.windowHeight = $window.innerHeight;
        $scope.windowWidth = $window.innerWidth;
        $scope.editorHeight = $window.innerHeight - editor_tabs.clientHeight - 28;
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
  }
]);