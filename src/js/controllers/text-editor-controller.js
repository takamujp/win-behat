

angular.module('winbehat').controller('textEditorController', function ($scope) {
    $scope.editorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: false,
        extraKeys: {
            Tab: function(cm) {
                var indent_unit = cm.getOption('indentUnit'),
                    spaces = '',
                    sel = cm.doc.sel,
                    from = sel.from,
                    to = sel.to,
                    line_no = 0,
                    len = 0,
                    replaced = [],
                    start = {line: 0, ch: 0},
                    end = {line: 0, ch: 0};
                    
                if (!cm.somethingSelected()) {
                    spaces = Array(indent_unit - from.ch % indent_unit + 1).join(' ');
                    cm.replaceSelection(spaces, 'end', '+input');
                } else {
                    spaces = Array(indent_unit + 1).join(' ');
                    start.line = from.line;
                    for (line_no = from.line, len = line_no + cm.getSelection().split('\n').length - !to.ch; line_no < len; line_no++) {
                        replaced.push(spaces + cm.doc.getLine(line_no));
                        end.line = line_no;
                        end.ch = cm.doc.getLine(line_no).length;
                    }
                    
                    cm.doc.replaceRange(replaced.join('\n'), start, end);
                    
                    start.ch = from.ch + indent_unit;
                    end.ch = to.ch + indent_unit;
                    cm.doc.setSelection(start, end);
                }
            }
        }
    };
});