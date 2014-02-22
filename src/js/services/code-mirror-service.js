
angular.module('winbehat').factory('codeMirrorService', function () {
    
    var fxl = require('./js/my-modules/filename-extension-list');
    
    var insertTab = function (cm) {
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
    };
    
    var autocomplete = function (cm) {
        CodeMirror.showHint(cm, cm.getHelper(cm.getCursor(), 'hint') || CodeMirror.hint.anyword);
    };
    
    CodeMirror.modeURL = 'js/lib/codemirror/mode/%N/%N.js';
    
    var changeMode = function (cm, ext) {
        CodeMirror.autoLoadMode(cm, fxl[ext]);
        cm.setOption("mode", fxl[ext]);
    };
    
    return {
        'insertTab': insertTab,
        'autocomplete': autocomplete,
        'changeMode': changeMode
    };
});

