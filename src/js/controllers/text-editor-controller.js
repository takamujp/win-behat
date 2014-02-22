

angular.module('winbehat').controller('textEditorController', function ($scope, codeMirrorService) {
    
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
});