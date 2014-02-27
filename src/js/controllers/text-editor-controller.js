

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
    
    $scope.$watchCollection('editFilelist', function (list) {
        var len = list.length;
        if (len) {
            $scope.select(len - 1);
            updateLastText();
        }
    });
    
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
        $scope.editFile = editFilelistService.select(index) || {text: ''};
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
    
    var updateLastText = function () {
        // 更新されたかを判定するために、読み込み時のテキストを記憶しておく
        // CodeMirrorに値をセットする前と後で比較すると別の文字列と判定されてしまうので、
        // 一度CodeMirrorにセットしてその値を記憶させておく。
        $scope.codeMirror.doc.setValue($scope.editFile.text);
        $scope.editFile.lastText = $scope.codeMirror.doc.getValue();
    };
});