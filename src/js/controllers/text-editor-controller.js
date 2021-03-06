

angular.module('winbehat').controller('textEditorController', function ($scope, $window, codeMirrorService, editFilelistService, modalService, behatService, highlighService) {
    $scope.editFilelist = editFilelistService.list;
    $scope.editFileCount = 0;
    $scope.editFile = {};
    $scope.codeMirror = {};
    $scope.editorOptions = {
        theme: 'mbo',
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        styleSelectedText: true,
        styleActiveLine: true,
        continueComments: true,
        mode: null,
        extraKeys: {
            'Ctrl-/': 'toggleComment',
            'Tab': codeMirrorService.insertTab,
            'Ctrl-Space': codeMirrorService.autocomplete,
            'Ctrl-S': function () {_save();},
            'Ctrl-B': function () {_runBehat();},
            'Alt-B': function () {_runBehat(['--stop-on-failure']);},
            'Shift-Ctrl-B': function () {_showSnippets();},
            'Ctrl-W': function () {
                if ($scope.editFile.file) {
                    $scope.close(editFilelistService.getId($scope.editFile.file.path()));
                    $scope.$apply();
                }
            },
            'Shift-Ctrl-W': function () {$scope.closeAll();},
            'Ctrl-Tab': function () {_switchNextTab();$scope.$apply();},
            'Shift-Ctrl-Tab': function () {_switchPrevTab();$scope.$apply();}
        },
        onLoad: function (cm) {
            $scope.codeMirror = cm;
            
            cm.on('focus', function () {
                $scope.editFile.file && $scope.editFile.file.path && $scope.editFile.file.path() && highlighService.highlight($scope.editFile.file.path());
            });
        }
    };
    
    /**
     * 編集中のファイルを監視,ファイルが増えた時にそのファイルを選択中にする
     */
    $scope.$watchCollection('editFilelist', function (list) {
        var len = list.length;
        if (len > $scope.editFileCount) {
            $scope.select(len - 1);

            // 更新されたかを判定するために、読み込み時のテキストを記憶しておく
            // CodeMirrorに値をセットする前と後で比較すると別の文字列と判定されてしまうので、一度CodeMirrorにセットしてその値を記憶させる。
            $scope.codeMirror.doc.setValue($scope.editFile.text);
            $scope.editFile.lastText = $scope.codeMirror.doc.getValue();
        }
        $scope.editFileCount = len;
    });
    
    /**
     * タブを太字で表示するかどうかを判定する
     * 
     * @param {object} file
     */
    $scope.isBold = function (file) {
        return {
            'bold': $scope.editFile == file ? file.lastText != $scope.codeMirror.getValue() : file.isChanged()
        };
    };
    
    /**
     * タブ選択
     * 
     * @param {number} index
     */
    $scope.select = function (index) {
        var prev = $scope.editFile,
            selected = editFilelistService.select(index) || {text: ''},
            removeLastHistory = null;
    
        if(prev.path && selected.path && prev.path() == selected.path()) {
            return;
        }
        
        // ハイライト
        selected.file && selected.file.path && highlighService.highlight(selected.file.path());
        
        window.dispatchEvent(new Event('changeTab'));
        $scope.editFile = selected;
        
        // modeによってCodeMirrorのオプションを切り替える
        $scope.codeMirror.setOption('mode', selected.mode || '');
        selected.mode && CodeMirror.autoLoadMode($scope.codeMirror, selected.mode);
        $scope.codeMirror.setOption('indentUnit', selected.mode == 'gherkin' ? 2 : 4);
        
        // 「space」を入力すると何故か$scope.editFile.textがundefinedになり、
        // タブ切り替えで元のタブに戻した時にテキストが表示されなくなってしまうので、
        // このタイミングでtextをCodeMirrorから取得しておく
        prev.text = $scope.codeMirror.getValue();
        
        // タブを切り替えた時にredo,undoが正常に動作するように、ファイルごとにhistoryを覚えさせる
        if (prev.file && prev.file.path()) {
            prev.history = $scope.codeMirror.getHistory();
        }
        $scope.codeMirror.clearHistory();
        if ($scope.editFile.history) {
            $scope.codeMirror.setHistory($scope.editFile.history);
        }
        
        // 「前のタブのテキストから現在のタブのテキストへの変更」がhistoryに保存されるため、
        // hisotryの変更を監視して、最新のhistoryを1件削除する。
        removeLastHistory = $scope.$watch('codeMirror.doc.history', function () {
            $scope.codeMirror.doc.history.done.pop();
            removeLastHistory(); // 削除したら監視解除
        });
        
        $scope.codeMirror.focus();
    };
    
    $scope.$on('selectAlreadyOpenFile', function(event, id) {
        $scope.select(id);
    });
    
    $scope.$on('deleteAlreadyOpenFile', function(event, id) {
        $scope.editFilelist[id].lastText = $scope.editFilelist[id].text;
        $scope.close(id);
        $scope.$apply();
    });
    
    /**
     * ファイルを閉じる
     * 
     * @param {number} index
     * @param {boolean} [hideCancel=null]
     */
    $scope.close = function (index, hideCancel) {
        
        var modalInstance = null,
            // 保存直後に編集中のファイルを閉じようとすると、何故か$scope.editFile.textが空の文字列になる場合があるので、その場合はcodeMirrorの現在の値と比較するようにする
            text = ($scope.editFilelist[index] == $scope.editFile) ? $scope.codeMirror.getValue() : $scope.editFilelist[index].text,
            close = function () {
                var file = editFilelistService.remove(index);

                if (file.file.path() == $scope.editFile.file.path()) {
                    $scope.select(index - 1);
                }
            };
        
        if (text != $scope.editFilelist[index].lastText) {
            modalInstance = modalService.openModal('template/modal/confirm.html', false, {
                'yesLabel': '保存して閉じる',
                'noLabel': '保存せずに閉じる',
                'cancelLabel': 'キャンセル',
                'hideCancel': hideCancel,
                'title': '保存の確認',
                'message': $scope.editFilelist[index].file.name + 'は変更されています。保存しますか？'
            });
            modalInstance.result.then(function (result) {
                if (result.selected == 'ok') {
                    _save(function (err) {
                        if (err) {
                            modalService.openModal('template/modal/error.html', true, {
                                title: 'ファイル保存エラー',
                                message: 'ファイルの保存に失敗しました。'
                            });
                            return;
                        }
                        
                        close();
                        $scope.$apply();
                    });
                } else if (result.selected == 'no') {
                    close();
                }
            });
        } else {
            close();
        }
    };
    
    /**
     * すべてのファイルを閉じる
     */
    $scope.closeAll = function () {
        var pathList = [],
            i = 0,
            id = 0,
            len = $scope.editFilelist.length;
    
        for (; i < len; i++) {
            pathList.push($scope.editFilelist[i].file.path());
        }
        
        for (i = 0; i < len; i++) {
            id = editFilelistService.getId(pathList[i]);
            if (id >= 0) {
                $scope.close(id);
                $scope.$apply();
            }
        }
    };
    
    /**
     * ファイルを保存する
     * 
     * @param {object} file
     */
    var _save = function (callback) {
        if (!$scope.editFile.file || $scope.editFile.lastText == $scope.codeMirror.getValue()) {
            return;
        }
        $scope.editFile.text = $scope.codeMirror.getValue();
        
        callback = callback || function (err) {
            if (err) {
                modalService.openModal('template/modal/error.html', true, {
                    title: 'ファイル保存エラー',
                    message: 'ファイルの保存に失敗しました。'
                });
                return;
            }
            
            $scope.$apply();
        };
        
        $scope.editFile.save(callback);
    };
   
    /**
     * 編集中のファイルでbehatを実行する
     */
    var _runBehat = function (options) {
        if (!$scope.editFile.file.path()) {
            return;
        }
        
        behatService.showHtmlResults($scope.editFile.file.path().split('features')[0], $scope.editFile.file.path(), options, $scope.editFile.root.split("\\").pop());
    };
    
    /**
     * 編集中のファイルのスニペットを表示する
     */
    var _showSnippets = function () {
        if (!$scope.editFile.file.path()) {
            return;
        }
        
        behatService.showSnippets($scope.editFile.file.path().split('features')[0], $scope.editFile.file.path());
    };
    
    /**
     * 前のタブに切り替える
     */
    var _switchPrevTab = function () {
        if ($scope.editFilelist.length <= 1) {
            return;
        };
        
        var id = editFilelistService.getId($scope.editFile.file.path());
        
        if (id < 0) {
            return;
        } else if (id == 0) {
            id = $scope.editFilelist.length - 1;
        } else {
            id--;
        }
        
        $scope.select(id);
    };
    
    /**
     * 次のタブに切り替える
     */
    var _switchNextTab = function () {
        if ($scope.editFilelist.length <= 1) {
            return;
        };
        
        var id = editFilelistService.getId($scope.editFile.file.path());
        
        if (id < 0) {
            return;
        } else if (id == $scope.editFilelist.length - 1) {
            id = 0;
        } else {
            id++;
        }
        
        $scope.select(id);
    };
    
    $scope.$on('closeProject', function (event, projectName) {
        var pathList = [],
            i = 0,
            id = 0,
            len = $scope.editFilelist.length;
    
        for (; i < len; i++) {
            if ($scope.editFilelist[i].root == projectName) {
                pathList.push($scope.editFilelist[i].file.path());
            }
        }
        
        for (i = 0; i < len; i++) {
            id = editFilelistService.getId(pathList[i]);
            if (id >= 0) {
                $scope.close(id, true);
            }
        }
    });
});