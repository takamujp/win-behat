
angular.module('winbehat').controller('directoryTreeController', function ($scope, $rootScope, $window, filelistService, editFilelistService, modalService, behatService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.hasFeatures = false;

    var fs = require('fs'),
        gui = require('nw.gui'),
        TMP_PATH = 'tmp/',
        PROHIBITED_CHARACTER = /[\\\/\:\*\?"<>\|]/g;

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
                        $scope.hasFeatures = true;
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
                _readDirectory(element.item);
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
     * ディレクトリの子要素を読み込む
     * 
     * @param {object} directory
     */
    var _readDirectory = function (directory) {
        filelistService.read(directory.name, function (filelist) {
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
            label: 'ファイル名',
            inputValue: $scope.contextTarget.file.name.split('\\').pop()
        });
        
        modalInstance.result.then(function (result) {
            var oldPath = '',
                newPath = '';
            
            if (result.selected == 'ok' && result.params.inputValue) {
                
                if (PROHIBITED_CHARACTER.test(result.params.inputValue)) {
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
            var directory = $scope.contextTarget.file,
                filename = directory.name;
            
            if (result.selected == 'ok' && result.params.inputValue) {
                if (PROHIBITED_CHARACTER.test(result.params.inputValue)) {
                    modalService.openModal('template/modal/error.html', true, {
                        title: '新規ファイル作成エラー',
                        message: 'ファイル名に \/:*?"<>| は使用できません'
                    });
                    return;
                }
            }
            
            filename += ('\\' + result.params.inputValue);            
            
            fs.open(filename, 'wx', '0777', function (err, fd) {
                if (err) {
                    modalService.openModal('template/modal/error.html', true, {
                        title: '新規ファイル作成エラー',
                        message: err.code == 'EEXIST' ? 'すでにファイルが存在します' : err.message
                    });
                    return;
                }
                
                fs.write(fd, new Buffer(''), 0, Buffer.byteLength(''), function (err) {
                    fs.close(fd);
                    if (err) {
                        modalService.openModal('template/modal/error.html', true, {
                            title: '新規ファイル作成エラー',
                            message: err.message
                        });
                        return;
                    }
                    
                    var file = filelistService.file(filename);
                
                    if (directory.isOpen) {
                        directory.children.push(file);
                        directory.children = directory.children.sort(filelistService.sortFunc);
                        directory.isShow = true;
                        $scope.$apply();
                    } else {
                        _readDirectory(directory);
                    }
                });
            });
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
            var directory = $scope.contextTarget.file,
                dirname = directory.name;
            
            if (result.selected == 'ok' && result.params.inputValue) {
                if (PROHIBITED_CHARACTER.test(result.params.inputValue)) {
                    modalService.openModal('template/modal/error.html', true, {
                        title: '新規ディレクトリ作成エラー',
                        message: 'ディレクトリ名に \/:*?"<>| は使用できません'
                    });
                    return;
                }
            }
            
            dirname += ('\\' + result.params.inputValue);            
                
            fs.mkdir(dirname, function (err) {
                if (err) {
                    modalService.openModal('template/modal/error.html', true, {
                        title: '新規ディレクトリ作成エラー',
                        message: err.code == 'EEXIST' ? 'すでに同名のディレクトリが存在します' : err.message
                    });
                    return;
                }

                var newDirectory = filelistService.file(dirname);
                newDirectory.isDirectory = true;
                newDirectory.children = [];

                if (directory.isOpen) {
                    directory.children.push(newDirectory);
                    directory.children = directory.children.sort(filelistService.sortFunc);
                    directory.isShow = true;
                    $scope.$apply();
                } else {
                    _readDirectory(directory);
                }
            });
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
        
        behatService.run($scope.filelist.name, '-f html', features, function (err, stdout, stderr) {
            var filename = '';
            
            if (err) {
                if (stdout) {
                    if (stdout.indexOf('<!DOCTYPE html')) {
                        _openBlankWindow('<pre>' + stdout + '</pre>');
                        return;
                    }
                } else {
                    modalService.openModal('template/modal/error.html', true, {
                        title: 'behat実行エラー',
                        message: stderr || err.message
                    });
                    return;
                }
            }
            
            filename = TMP_PATH + ($scope.filelist.name + features + '.html').replace(PROHIBITED_CHARACTER, '');
            
            var faildCreateFile = function () {
                fs.unlink('build/' + filename, function (err) {});
                _openBlankWindow(stdout);
            };
            
            fs.open('build/' + filename, 'w', '0777', function (err, fd) {
                if (err) {
                    faildCreateFile();
                    return;
                }
                
                fs.write(fd, new Buffer(stdout), 0, Buffer.byteLength(stdout), function (err) {
                    var win = null;
                    
                    fs.close(fd);
                    if (err) {
                        faildCreateFile();
                        return;
                    }
                    
                    win = gui.Window.get(
                        $window.open(filename)
                    );
                    
                     win.on('closed', function() {
                         win = null;
                         fs.unlink('build/' + filename, function (err) {});
                     });
                });
            });
            
        });
    };
    
    /**
     * behat実行(contextメニューから)
     */
    $scope.runBehat = function () {
        _runBehat($scope.contextTarget.file.name);
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
        
        behatService.run($scope.filelist.name, '-f snippets', features, function (err, stdout, stderr) {
            if (err && !stdout) {
                modalService.openModal('template/modal/error.html', true, {
                    title: 'behat実行エラー',
                    message: stderr || err.message
                });
                return;
            }
            
            if (stdout.replace(/[\n|\r]/g, '')) {
                _openBlankWindow('<pre>' + stdout + '</pre>');
            } else {
                modalService.openModal('template/modal/error.html', true, {
                    title: 'ステップ表示エラー',
                    message: '未定義のステップはありませんでした'
                });
            }
        });
    };
    
    /**
     * 未定義のステップを表示する(contextメニューから)
     */
    $scope.showSnippets = function () {
        _showSnippets($scope.contextTarget.file.name);
    };
    
    /**
     * 未定義のステップを表示する(イベントが発行されたら)
     */
    $scope.$on('showSnippets', function(event, features) {
        features = features || '';
        _showSnippets(features);
    });
    
    /**
     * windowをblankで開く
     * 
     * @param {string} message 表示する内容(html5)
     */
    var _openBlankWindow = function (message) {
        var win = $window.open('', '_blank');
        $(win.document.body).html(message);  
    };
    
    $scope.refreshFolder = function () {
        var parent = $scope.contextTarget.parent,
            index = $scope.contextTarget.index,
            file = $scope.contextTarget.file;
    
        if (!file.isDirectory || !file.isOpen) {
            return;
        }
        
        filelistService.read(file.name, function (filelist) {
            if (filelist) {
                parent.children[index] = filelist;
            } else {
                parent.children.splice(index, 1);
            }
            
            $scope.$apply();
        });
    };
    
});
