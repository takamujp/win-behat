
angular.module('winbehat').controller('directoryTreeController', function ($scope, $rootScope, $window, filelistService, editFilelistService, modalService, behatService, codeMirrorService, highlighService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.hasFeatures = false;
    $scope.lastDirectory = $window.localStorage.getItem('lastDirectory') || '';
    $scope.copyTarget = null;

    var path = require('path'),
        exec = require('child_process').exec;

    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object|string} element
     */
    $scope.openDirectory = function (element) {
        var dirPath = '';
        
        if (typeof element == 'string') {
            dirPath = element;
        } else if(element.files[0]) {
            dirPath = element.files[0].path;
        }
        
        if (!dirPath) {
            return;
        }
        
        $scope.hasFilelist = false;
        $scope.hasFeatures = false;
        
        // ディレクトリ直下のファイルの一覧を取得する
        filelistService.read(dirPath, null, function (filelist) {
            var i = 0, 
                len = 0,
                hasFeatures = false,
                modalInstance = null,
                dirHistory = null;

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
                        $scope.filelist[filelist.name] = filelist;
                        $scope.hasFilelist = true;
                        $scope.hasFeatures = true;
                    });
                    
                    $scope.lastDirectory = dirPath;
                    $window.localStorage.setItem('lastDirectory', dirPath);
                    
                    dirHistory = JSON.parse($window.localStorage.getItem('directoryHistory') || '[]');
                    dirHistory.unshift(dirPath);
                    dirHistory = dirHistory.filter(function (x, i, self) {
                        return self.indexOf(x) === i;
                    });
                    if (dirHistory.length > 5) {
                        dirHistory.pop();
                    }
                    $window.localStorage.setItem('directoryHistory', JSON.stringify(dirHistory));
                    $rootScope.$broadcast('updateDirecotryHistory');
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
                        } else if (Object.keys($scope.filelist).length){
                            $scope.hasFilelist = true;
                            $scope.hasFeatures = true;
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
        
        // ハイライト
        highlighService.highlight(element.item.path());
        
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
        filelistService.read(directory.name, directory.parent, function (filelist) {
//        filelistService.read(directory.path(), null, function (filelist) {
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
        var target = element.item || element.project;
        return {
            'icon-expand-directory': target.isDirectory() && target.isShow,
            'icon-contract-directory': target.isDirectory() && !target.isShow,
            'icon-file': !target.isDirectory(),
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
     * ディレクトリを削除する
     */
    $scope.deleteDirectory = function () {
        var modalInstance = null;
        
        modalInstance = modalService.openModal('template/modal/confirm.html', false, {
            'yesLabel': 'はい',
            'noLabel': 'いいえ',
            'hideCancel': true,
            'title': 'ディレクトリ削除確認',
            'message': 'ディレクトリを削除しますか？'
        });
        modalInstance.result.then(function (result) {
            if (result.selected == 'ok') {
                
                $scope.contextTarget.file.delete(function (err) {
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: 'ディレクトリ削除エラー',
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
                            message: typeof err == 'string' ? err : err.message
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
    var _runBehat = function (features, options) {
        if (!$scope.hasFeatures) {
            return;
        }
        
        var parent = '';
        
        for (var name in $scope.filelist) {
            if (features.toUpperCase() == name.toUpperCase() || features.toUpperCase().split(name.toUpperCase() + "\\").length > 1) {
                parent = name;
                break;
            }
        }
        
        behatService.showHtmlResults(parent, features, options, parent.split("\\").pop());
    };
    
    /**
     * behat実行(contextメニューから)
     */
    $scope.runBehat = function (options) {
        _runBehat($scope.contextTarget.file.path(), options);
    };
    
    /**
     * behat実行(イベントが発行されたら)
     */
    $scope.$on('runBehat', function(event, params) {
        var features = (params && params.features) || '',
            options = (params && params.options) || '';
        _runBehat(features, options);
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
        
        var parent = '';
        
        for (var name in $scope.filelist) {
            if (features.toUpperCase() == name.toUpperCase() || features.toUpperCase().split(name.toUpperCase() + "\\").length > 1) {
                parent = name;
                break;
            }
        }
        
        behatService.showSnippets(parent, features);
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
     * ディレクトリをリフレッシュする
     */
    $scope.refreshDirectory = function () {
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

            $scope.refreshDirectory();
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
    
    /**
     * エクスプローラで開く
     */
    $scope.explorer  = function () {
        exec('explorer ' + $scope.contextTarget.file.path());
    };
    
    /**
     * behat実行(イベントが発行されたら)
     */
    $scope.$on('openDirectory', function(event, title) {
        $scope.openDirectory(title);
    });
    
    /**
     * ツリーの要素のプロジェクト名をクリックした時の動作
     * 
     * @param {object} element
     */
    $scope.clickProject= function (element) {
        element.project.isShow = !element.project.isShow;
    };
    
    /**
     * プロジェクトを閉じる
     * 
     * @param {object} element
     */
    $scope.closeProject = function (element) {
        var modalInstance = null;
        
        modalInstance = modalService.openModal('template/modal/confirm.html', false, {
            'yesLabel': 'はい',
            'noLabel': 'いいえ',
            'hideCancel': true,
            'title': 'プロジェクトを閉じる',
            'message': element.project.name.split("\\").pop() + 'を閉じますか？'
        });
        modalInstance.result.then(function (result) {
            if (result.selected == 'ok') {
                $rootScope.$broadcast('closeProject', element.project.name);
                delete element.filelist[element.project.name];
            } 
        });
    };
});
