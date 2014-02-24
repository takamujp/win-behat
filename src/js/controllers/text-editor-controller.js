

angular.module('winbehat').controller('textEditorController', function ($scope, codeMirrorService, editFilelistService) {
    $scope.editFilelist = editFilelistService.list;
    $scope.editFile = {};
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
        }
    };
    
    $scope.$watchCollection('editFilelist', function (list) {
        var len = list.length;
        if (len) {
            $scope.select(len - 1);
        }
    });
    
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
});