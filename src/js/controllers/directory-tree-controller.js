
angular.module('winbehat').controller('directoryTreeController', function ($scope, $rootScope, $window, filelistService, editFilelistService, modalService, behatService, codeMirrorService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.hasFeatures = false;
    $scope.lastDirectory = $window.localStorage.getItem('lastDirectory') || '';
    $scope.copyTarget = null;

    var path = require('path');

    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object} element
     */
    $scope.openDirectory = function (element) {
        
        if (!element.files[0]) {
            return;
        }
        
        $scope.hasFilelist = false;
        $scope.hasFeatures = false;
        
        // ディレクトリ直下のファイルの一覧を取得する
        filelistService.read(element.files[0].path, null, function (filelist) {
            var i = 0, 
                len = 0,
                hasFeatures = false,
                modalInstance = null;

            if (filelist) {
                for (i = 0, len = filelist.children.length; i < len; i++) {
                    if (filelist.children[i].name == 'features') {
                        hasFeatures = true;
                        break;
                    }
                }

                // featuresディレクトリが存在するならそのまま、ツリーに表示させる
                if (hasFeatures) {
                    $scope.$apply(function () {
                        $scope.filelist = filelist;
                        $scope.hasFilelist = true;
                        $scope.hasFeatures = true;
                    });
                    
                    $scope.lastDirectory = element.files[0].path;
                    $window.localStorage.setItem('lastDirectory', element.files[0].path);
                    codeMirrorService.initBehatHint(path.join(filelist.path(), 'features\\bootstrap'));
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
                            behatService.init(filelist.path(), function (err, stdout, stderr) {
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
        
        var result = null,
            isDir = false;
        
        // ディレクトリなら表示を切り替える
        try {
            isDir = element.item.isDirectory();
        } catch (e) {
            element.item.parent.children.splice(index, 1);
            return;
        }
        
        if (isDir) {
            if (element.item.isOpen) {
                element.item.isShow = !element.item.isShow;
            } else {
                _readDirectory(element.item);
            }
        } else { // ファイルならエディタを開く
            result = editFilelistService.push(element.item);
            
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
     * ディレクトリの子要素を読み込む
     * 
     * @param {object} directory
     */
    var _readDirectory = function (directory) {
        filelistService.read(directory.path(), null, function (filelist) {
            $scope.$apply(function () {
                if (filelist) {
                    directory.children = filelist.children;
                }
                directory.isOpen = true;
                directory.isShow = true;
            });
        });
    };
    
    /**
     * アイコンのクラスを取得する
     * 
     * @param {object} element
     * @returns {object} ng-class用オブジェクト
     */
    $scope.getIconClass = function (element) {
        return {
            'icon-expand-directory': element.item.isDirectory() && element.item.isShow,
            'icon-contract-directory': element.item.isDirectory() && !element.item.isShow,
            'icon-file': !element.item.isDirectory(),
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
                
                $scope.contextTarget.file.delete(function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: 'ファイル削除エラー',
                            message: err.message
                        });

                        return;
                    }
                    var id = editFilelistService.getId($scope.contextTarget.file.path());

                    if (id >= 0) {
                        $rootScope.$broadcast('deleteAlreadyOpenFile', id);
                    }
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
            label: 'ファイル名',
            inputValue: $scope.contextTarget.file.name
        });
        
        modalInstance.result.then(function (result) {            
            if (result.selected == 'ok' && result.params.inputValue) {
                $scope.contextTarget.file.rename(result.params.inputValue, function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: 'ファイル名変更エラー',
                            message: err.message
                        });
                        return;
                    }
                    
                    $scope.$apply();
                }); 
            }
        });
    };
    
    /**
     * 新規ファイル作成
     */
    $scope.createFile = function () {
        var modalInstance = null;
        
        modalInstance = modalService.openModal('template/modal/input.html', false, {
            title: '新規ファイル作成',
            label: 'ファイル名'
        });
        
        modalInstance.result.then(function (result) {
            if (result.selected == 'ok' && result.params.inputValue) {
                
                $scope.contextTarget.file.createChildFile(result.params.inputValue, '', function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: '新規ファイル作成エラー',
                            message: err.message
                        });
                    }
                    $scope.contextTarget.file.sortChildren();
                    $scope.$apply();
                }); 
            }
        });
    };
    
    
    /**
     * 新規ディレクトリ作成
     */
    $scope.createDirectory = function () {
        var modalInstance = null;
        
        modalInstance = modalService.openModal('template/modal/input.html', false, {
            title: '新規ディレクトリ作成',
            label: 'ディレクトリ名'
        });
        
        modalInstance.result.then(function (result) {            
            if (result.selected == 'ok' && result.params.inputValue) {
                $scope.contextTarget.file.createChildDirectory(result.params.inputValue, function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: '新規ディレクトリ作成エラー',
                            message: err.message
                        });
                        return;
                    }
                    
                    $scope.contextTarget.file.sortChildren();
                    $scope.$apply();
                });
            }
        });
    }; 
    
    /**
     * behat実行
     * 
     * @param {string} features 実行対象のfeatureファイル・ディレクトリのパス
     */
    var _runBehat = function (features) {
        if (!$scope.hasFeatures) {
            return;
        }
        
        behatService.showHtmlResults($scope.filelist.name, features);
    };
    
    /**
     * behat実行(contextメニューから)
     */
    $scope.runBehat = function () {
        _runBehat($scope.contextTarget.file.path());
    };
    
    /**
     * behat実行(イベントが発行されたら)
     */
    $scope.$on('runBehat', function(event, features) {
        features = features || '';
        _runBehat(features);
    });
    
    /**
     * behatを実行して、未定義のステップを表示する
     * 
     * @param {string} features 実行対象のfeatureファイル・ディレクトリのパス
     */
    var _showSnippets = function (features) {
        if (!$scope.hasFeatures) {
            return;
        }
        
        behatService.showSnippets($scope.filelist.name, features);
    };
    
    /**
     * 未定義のステップを表示する(contextメニューから)
     */
    $scope.showSnippets = function () {
        _showSnippets($scope.contextTarget.file.path());
    };
    
    /**
     * 未定義のステップを表示する(イベントが発行されたら)
     */
    $scope.$on('showSnippets', function(event, features) {
        features = features || '';
        _showSnippets(features);
    });
    
    /**
     * フォルダをリフレッシュする
     */
    $scope.refreshFolder = function () {
        var parent = $scope.contextTarget.parent,
            index = $scope.contextTarget.index,
            file = $scope.contextTarget.file;
    
        if (!file.isDirectory() || !file.isOpen) {
            return;
        }
        
        filelistService.read(file.path(), null, function (filelist) {
            if (filelist) {
                file.children = filelist.children;
            } else {
                parent.children.splice(index, 1);
            }
            
            $scope.$apply();
        });
    };
    
    
    /**
     * ファイルをコピーする(コピーするファイルを記憶する)
     */
    $scope.copy = function () {
        $scope.copyTarget = $scope.contextTarget.file;
    }; 
    
    /**
     * ファイルを貼り付ける
     */
    $scope.paste = function () {
        
        if (!$scope.copyTarget) {
            return;
        }
        
        var modalInstance = null,
            file = $scope.contextTarget.file,
            copyTo = path.join(file.path(), path.basename($scope.copyTarget.name)),
            callback = null;

        if (copyTo == $scope.copyTarget.path()) {
            return;
        }

        callback = function(err) {
            if (err) {
                modalService.openModal('template/modal/error.html', true, {
                    title: '貼り付けエラー',
                    message: err.message
                });
                return;
            }

            $scope.refreshFolder();
        };
        
        if (path.existsSync(copyTo)) {
            modalInstance = modalService.openModal('template/modal/confirm.html', false, {
                'yesLabel': 'はい',
                'noLabel': 'キャンセル',
                'hideCancel': true,
                'title': '上書き確認',
                'message': '同名のファイルが存在します。上書きしますか？'
            });
            
            modalInstance.result.then(function (result) {
                if (result.selected == 'ok') {
                    file.copyFrom($scope.copyTarget.path(), callback);
                } 
            });
        } else {
            file.copyFrom($scope.copyTarget.path(), callback);
        }
    };
});
