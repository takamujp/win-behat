

angular.module('winbehat').controller('textEditorController', function ($scope, codeMirrorService, editFilelistService) {
    $scope.editFilelist = editFilelistService.list;
    $scope.editorOptions = {
        lineWrapping: true,
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
    
    /**
     * タブ選択
     * 
     * @param {object} file
     */
    $scope.select = function (file) {
        editFilelistService.select(file);
    };
    
    /**
     * ファイルを閉じる
     * 
     * @param {number} $index
     */
    $scope.remove = function ($index) {
        editFilelistService.remove($index);
    };
});