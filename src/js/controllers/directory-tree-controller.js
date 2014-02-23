
angular.module('winbehat').controller('directoryTreeController', function ($scope, filelistService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;

    $scope.openDirectory = function (element) {
        
        if (!element.files[0]) {
            return;
        }
        
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
});
