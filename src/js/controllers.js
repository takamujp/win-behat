angular.module('winbehat').controller('directoryTreeController', [
  '$scope',
  'filelistService',
  function ($scope, filelistService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.openDirectory = function (element) {
      filelistService.read(element.files[0].path, function (filelist) {
        $scope.$apply(function () {
          if (filelist) {
            $scope.filelist = filelist;
          }
          $scope.hasFilelist = true;
        });
      });
    };
    /**
     * ツリーの要素をクリックした時の動作
     * 
     * @param {object} element
     * @param {number} id
     */
    $scope.clickNode = function (element, id) {
      // ディレクトリなら表示を切り替える
      if (element.item.isDirectory) {
        if (element.item.isOpen) {
          element.item.isShow = !element.item.isShow;
        } else {
          filelistService.read(element.item.name, function (filelist) {
            $scope.$apply(function () {
              if (filelist) {
                element.item.children = filelist.children;
              }
              element.item.isOpen = true;
              element.item.isShow = true;
            });
          });
        }
      } else {
      }
    };
    /**
     * アイコンのクラスを取得する
     * 
     * @param {object} element
     * @returns {object} ng-class用オブジェクト
     */
    $scope.getIconClass = function (element) {
      return {
        'icon-expand-directory': element.item.isDirectory && element.item.isShow,
        'icon-contract-directory': element.item.isDirectory && !element.item.isShow,
        'icon-file': !element.item.isDirectory,
        'tree-icon': true
      };
    };
  }
]);angular.module('winbehat').controller('testController', [
  '$scope',
  'behatService',
  function ($scope, behatService) {
    $scope.initTarget = 'init';
    $scope.runTarget = 'run';
    $scope.result = 'ret';
    $scope.initBehat = function () {
      behatService.init($scope.initTarget, function (err, stdout, stderr) {
        $scope.$apply(function () {
          $scope.result = err + ' ' + stdout;
        });
      });
    };
    $scope.runBehat = function () {
      behatService.run($scope.runTarget, '.', function (err, stdout, stderr) {
        $scope.$apply(function () {
          $scope.result = err + ' ' + stdout;
        });
      });
    };
  }
]);