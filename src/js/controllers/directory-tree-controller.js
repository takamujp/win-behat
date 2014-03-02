
angular.module('winbehat').controller('directoryTreeController', function ($scope, $rootScope, filelistService, editFilelistService, modalService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;

    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object} element
     */
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
     * @param {number} index
     */
    $scope.clickNode = function (element, index) {
        
        var result = null;
        
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
        } else { // ファイルならエディタを開く
            result = editFilelistService.push(element.item.name);
            
            if (result !== true) {
                if (typeof result == 'number') {
                    $rootScope.$broadcast('selectAlreadyOpenFile', result);
                } else {
                    modalService.openModal('template/modal/error.html', true, {
                        title: 'ファイル読み込みエラー',
                        message: result.message
                    });
                }
            }
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
