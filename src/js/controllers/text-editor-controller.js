

angular.module('winbehat').controller('textEditorController', function ($scope, codeMirrorService, editFilelistService, modalService) {
    $scope.editFilelist = editFilelistService.list;
    $scope.editFileCount = 0;
    $scope.editFile = {};
    $scope.codeMirror = {};
    $scope.editorOptions = {
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        styleSelectedText: true,
        styleActiveLine: true,
        continueComments: true,
        mode: 'php',
        extraKeys: {
            'Ctrl-/': 'toggleComment',
            'Tab': codeMirrorService.insertTab,
            'Ctrl-Space': codeMirrorService.autocomplete,
            'Ctrl-S': function () {save();}
        },
        onLoad: function (cm) {
            $scope.codeMirror = cm;
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
            'bold': file.isChanged()
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
    
        if(prev.path == selected.path) {
            return;
        }
    
        $scope.editFile = selected;
        
        // 「space」を入力すると何故か$scope.editFile.textがundefinedになり、
        // タブ切り替えで元のタブに戻した時にテキストが表示されなくなってしまうので、
        // このタイミングでtextをCodeMirrorから取得しておく
        prev.text = $scope.codeMirror.getValue();
        
        // タブを切り替えた時にredo,undoが正常に動作するように、ファイルごとにhistoryを覚えさせる
        if (prev.path) {
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
    };
    
    /**
     * ファイルを閉じる
     * 
     * @param {number} index
     */
    $scope.close = function (index) {
        
        var modalInstance = null,
            close = function () {
                var file = editFilelistService.remove(index);

                if (file.path == $scope.editFile.path) {
                    $scope.select(index - 1);
                }
            };
        
        if ($scope.editFilelist[index].text != $scope.editFilelist[index].lastText) {
            modalInstance = modalService.openModal('template/modal/confirm.html', false, {
                'yesLabel': '保存して閉じる',
                'noLabel': '保存せずに閉じる',
                'cancelLabel': 'キャンセル',
                'hideCancel': true,
                'title': '保存の確認',
                'message': 'ファイルは変更されています。保存しますか？'
            });
            modalInstance.result.then(function (result) {
                if (result.selected == 'ok') {
                    save(function (err) {
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
     * ファイルを保存する
     * 
     * @param {object} file
     */
    var save = function (callback) {
        if (!$scope.editFile.path || !$scope.editFile.isChanged()) {
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
    
});