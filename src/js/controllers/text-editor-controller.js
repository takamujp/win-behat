

angular.module('winbehat').controller('textEditorController', function ($scope, codeMirrorService, editFilelistService) {
    $scope.editFilelist = editFilelistService.list;
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
            'Ctrl-Space': codeMirrorService.autocomplete
        },
        onLoad: function (cm) {
            $scope.codeMirror = cm;
        }
    };
    
    /**
     * 編集中のファイルを監視、編集中のファイルに増減があるとき一番後ろのタブを選択状態にする
     */
    $scope.$watchCollection('editFilelist', function (list) {
        var len = list.length;
        if (len) {
            $scope.select(len - 1);
            updateLastText();
        }
    });
    
    /**
     * タブを太字で表示するかどうかを判定する
     * 
     * @param {object} file
     */
    $scope.isBold = function (file) {
        return {
            'bold': file.text != file.lastText
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
    $scope.remove = function (index) {
        editFilelistService.remove(index);
        $scope.select(index - 1);
    };
    
    /**
     * 最後に保存したテキストを記憶させる
     */
    var updateLastText = function () {
        // 更新されたかを判定するために、読み込み時のテキストを記憶しておく
        // CodeMirrorに値をセットする前と後で比較すると別の文字列と判定されてしまうので、
        // 一度CodeMirrorにセットしてその値を記憶させておく。
        $scope.codeMirror.doc.setValue($scope.editFile.text);
        $scope.editFile.lastText = $scope.codeMirror.doc.getValue();
    };
});