
angular.module('winbehat').controller('directoryTreeController', function ($scope, $rootScope, filelistService, editFilelistService, modalService, behatService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.hasFeatures = false;

    var fs = require('fs');

    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object} element
     */
    $scope.openDirectory = function (element) {
        
        if (!element.files[0]) {
            return;
        }
        
        // ディレクトリ直下のファイルの一覧を取得する
        filelistService.read(element.files[0].path, function (filelist) {
            var i = 0, 
                len = 0,
                hasFeatures = false,
                modalInstance = null;

            if (filelist) {
                for (i = 0, len = filelist.children.length; i < len; i++) {
                    if (filelist.children[i].name.split('\\').pop() == 'features') {
                        hasFeatures = true;
                        break;
                    }
                }

                // featuresディレクトリが存在するならそのまま、ツリーに表示させる
                if (hasFeatures) {
                    $scope.$apply(function () {
                        $scope.filelist = filelist;
                        $scope.hasFilelist = true;
                    });
                } 
                // 存在しない場合
                else {
                    modalInstance = modalService.openModal('template/modal/confirm.html', false, {
                        'yesLabel': 'はい',
                        'noLabel': 'いいえ',
                        'hideCancel': true,
                        'title': 'behat --init 実行確認',
                        'message': '直下にfeaturesディレクトリが存在しなければ開くことができません。作成しますか？'
                    });
                    modalInstance.result.then(function (result) {
                        if (result.selected == 'ok') {
                            behatService.init(filelist.name, function (err, stdout, stderr) {
                                if (err) {
                                    modalService.openModal('template/modal/error.html', true, {
                                        title: 'behat --init エラー',
                                        message: stderr || err.message
                                    });
                                    return;
                                }
                                $scope.openDirectory(element);
                            });
                        } 
                    });
                }
            }
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
    
    
    /**
     * ファイルを削除する
     */
    $scope.deleteFile = function () {
        var modalInstance = null;
        
        modalInstance = modalService.openModal('template/modal/confirm.html', false, {
            'yesLabel': 'はい',
            'noLabel': 'いいえ',
            'hideCancel': true,
            'title': 'ファイル削除確認',
            'message': 'ファイルを削除しますか？'
        });
        modalInstance.result.then(function (result) {
            if (result.selected == 'ok') {
                fs.unlink($scope.contextTarget.file.name, function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: 'ファイル削除エラー',
                            message: err.message
                        });

                        return;
                    }
                    var id = editFilelistService.getId($scope.contextTarget.file.name);

                    if (id >= 0) {
                        $rootScope.$broadcast('deleteAlreadyOpenFile', id);
                    }


                    $scope.contextTarget.parent.children.splice($scope.contextTarget.index, 1);
                    $scope.$apply();

                });
            } 
        });
    };
    
    /**
     * ファイル名を変更する
     */
    $scope.renameFile = function () {
        var modalInstance = null;
        
        modalInstance = modalService.openModal('template/modal/input.html', false, {
            title: 'ファイル名変更',
            label: 'ファイル名'
        });
        
        modalInstance.result.then(function (result) {
            var oldPath = '',
                newPath = '';
            
            if (result.selected == 'ok' && result.params.inputValue) {
                
                if (/[\\\/\:\*\?"<>\|]/.test(result.params.inputValue)) {
                    modalService.openModal('template/modal/error.html', true, {
                        title: 'ファイル名変更エラー',
                        message: 'ファイル名に \/:*?"<>| は使用できません'
                    });
                    return;
                }
                
                oldPath = $scope.contextTarget.file.name;
                newPath = $scope.contextTarget.file.name.split('\\');
                newPath.pop();
                newPath.push(result.params.inputValue);
                newPath = newPath.join('\\');
                
                if (fs.existsSync(newPath)) {
                    modalService.openModal('template/modal/error.html', true, {
                        title: 'ファイル名変更エラー',
                        message: 'すでに存在するファイル名です'
                    });
                    return;
                }
                
                fs.rename(oldPath, newPath, function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: 'ファイル名変更エラー',
                            message: err.message
                        });
                        return;
                    }
                    
                    var id = editFilelistService.getId(oldPath);
            
                    if (id >= 0) {
                        editFilelistService.rename(id, newPath);
                    }
                   
                    $scope.contextTarget.file.name = newPath;
                    $scope.$apply();
                });
            }
        });
    };
});
