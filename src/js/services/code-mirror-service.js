
angular.module('winbehat').factory('codeMirrorService', function () {
    
    var fxl = require('./js/my-modules/filename-extension-list');
    var fs = require('fs');
    var path = require('path');
    
    /**
     * タブを挿入する
     * 
     * @param {CodeMirror} cm
     */
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
    
    /**
     * 入力補完機能
     * 
     * @param {CodeMirror} cm
     */
    var autocomplete = function (cm) {
        CodeMirror.showHint(cm, cm.getHelper(cm.getCursor(), 'hint') || CodeMirror.hint.anyword);
    };
    
    CodeMirror.modeURL = 'js/lib/codemirror/mode/%N/%N.js';
    
    /**
     * CodeMirrorのmodeを切り替える
     * 
     * @param {CodeMirror} cm
     * @param {string} ext 拡張子
     */
    var changeMode = function (cm, ext) {
        CodeMirror.autoLoadMode(cm, fxl[ext]);
        cm.setOption("mode", fxl[ext]);
    };
    
    var behatContexts = {};
   
    CodeMirror.gherkinHint = gherkinHint; // deprecated
    CodeMirror.registerHelper("hint", "gherkin", gherkinHint);
    
    var WORD = /[^\x01-\x7E]|[\w$]+/, RANGE = 500;
    function gherkinHint(editor, options) {
        var word = options && options.word || WORD;
        var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
        var start = cur.ch, end = start;
        while (end < curLine.length && word.test(curLine.charAt(end)))
            ++end;
        while (start && word.test(curLine.charAt(start - 1)))
            --start;
        var curWord = start != end && curLine.slice(start, end);

        var list = [];
        var behatSteps = getSteps();

        for (var i = 0, len = behatSteps.length; i < len ; i++) {
//            if (!curWord || behatSteps[i].indexOf(curWord, 0) != -1) {
             if (!curWord || behatSteps[i].lastIndexOf(curWord, 0) == 0) {
                 list.push(behatSteps[i]);
             }
        }
        
        return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
    };
    
    function getSteps() {
        var steps = [];
        for (var key in behatContexts) {
            Array.prototype.push.apply(steps, behatContexts[key]);
        }
        
        return steps.sort(function (a, b) { return (a > b) ? 1 : -1; });
    }
    
    function readContextFile (base_dir) {
        if (!fs.existsSync(base_dir)) {
            return;
        }

        if (!fs.statSync(base_dir).isDirectory()) {

            if (/.*(Context\.php)$/.test(base_dir)) {
                fs.readFile(base_dir, function (err, data) {
                    behatContexts[base_dir] = data.toString().match(/@Give.*\/\^(.*)\$\//g).map(function (v) {return v.replace(/@Give.*\/\^(.*)\$\//, '$1')});
                })
            }
            return;
        }

        fs.readdir(base_dir, function (err, filelist) {
            if (err) {
                return;
            }

            if (!filelist.length) {
                return;
            }

            for (var i = 0, len = filelist.length; i < len; i++) {
                readContextFile(path.join(base_dir, filelist[i]));
            }
        });
    }
    
    var watch = null;
    var timerId = null;
    var initBehatHint = function (featureDirectory) {
        behatContexts = {};
        
        if (timerId != null) {
            clearTimeout(timerId);
        }
        
        var timer = function () {
            readContextFile(featureDirectory);
            timerId = setTimeout (timer, 30000);
        };
        timer();
    };
    
    return {
        'insertTab': insertTab,
        'autocomplete': autocomplete,
        'changeMode': changeMode,
        'initBehatHint': initBehatHint
    };
});

