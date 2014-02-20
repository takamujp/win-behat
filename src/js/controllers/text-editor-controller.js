

angular.module('winbehat').controller('textEditorController', function ($scope) {
    $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {
            Tab: function(cm) {
                var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
                cm.replaceSelection(spaces, 'end', '+input');
            }
        }
    };
});