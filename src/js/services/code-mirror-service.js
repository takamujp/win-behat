
angular.module('winbehat').factory('codeMirrorService', function () {
    
    var fxl = require('./js/my-modules/filename-extension-list');
    var fs = require('fs');
    var path = require('path');
    
    var mode = CodeMirror.modes.gherkin();
    mode.lineComment = '#';
    CodeMirror.defineMode('gherkin', function () { return mode;});
    
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
    
    //=======================================
    // behat用の補完機能
    //=======================================
    var behatContexts = {};
    var behatWords = '# language: ja,フィーチャ,シナリオ,前提,かつ,もし,ならば'.split(',');
    
    CodeMirror.gherkinHint = gherkinHint; // deprecated
    CodeMirror.registerHelper("hint", "gherkin", gherkinHint);
    
    var WORD = /[\S]+/;
    function gherkinHint(editor, options) {
        var word = options && options.word || WORD,
            cur = editor.getCursor(), curLine = editor.getLine(cur.line),
            start = cur.ch, 
            end = start,
            curWord = false,
            list = [],
            behatSnippets = getSnippets();
    
        while (end < curLine.length && word.test(curLine.charAt(end))) {
            ++end;
        }
        while (start && word.test(curLine.charAt(start - 1))) {
            --start;
        }
        
        curWord = start != end && curLine.slice(start, end);
        
        if (!curWord) {
            list = list.concat(behatWords);
        }
        
        for (var i = 0, len = behatSnippets.length; i < len ; i++) {
            if (!curWord || behatSnippets[i].indexOf(curWord, 0) != -1) {
//             if (!curWord || behatSteps[i].lastIndexOf(curWord, 0) == 0) {
                 list.push(behatSnippets[i]);
             }
        }
        
        return {list: list.concat(anyWordHint(editor, options)), from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
    };
    
    function getSnippets() {
        var steps = [];
        for (var key in behatContexts) {
            Array.prototype.push.apply(steps, behatContexts[key]);
        }
        
        return steps.sort(function (a, b) { return (a > b) ? 1 : -1; });
    }
    
    function anyWordHint (editor, options) {
        var word = options && options.word || /[\w$]+/,
            range = options && options.range || 500,
            cur = editor.getCursor(), curLine = editor.getLine(cur.line),
            start = cur.ch,
            end = start,
            curWord = false,
            list = [],
            seen = {},
            re = null;
    
        while (end < curLine.length && word.test(curLine.charAt(end))) {
            ++end;
        }
        while (start && word.test(curLine.charAt(start - 1))) {
            --start;
        }
        
        curWord = start != end && curLine.slice(start, end);

        re = new RegExp(word.source, "g");
        for (var dir = -1; dir <= 1; dir += 2) {
            var line = cur.line, endLine = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
            for (; line != endLine; line += dir) {
                var text = editor.getLine(line), m;
                while (m = re.exec(text)) {
                    if (line == cur.line && m[0] === curWord) {
                        continue;
                    }
                    if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
                        seen[m[0]] = true;
                        list.push(m[0]);
                    }
                }
            }
        }
        return list;
    };
    
    /**
     * ディレクトリを再帰的に読み込みcontext.phpファイルからスニペットを抽出する
     * 
     * @param {string} base_dir 読み込むディレクトリ
     */
    function readContextFile (base_dir) {
        if (!fs.existsSync(base_dir)) {
            return;
        }

        if (!fs.statSync(base_dir).isDirectory()) {

            if (/.*(Context\.php)$/.test(base_dir)) {
                fs.readFile(base_dir, function (err, data) {
                    
                    var matches = data.toString().match(/@Give.*\/\^(.*)\$\//g);
                    behatContexts[base_dir] = matches ? matches.map(function (v) {return v.replace(/@Give.*\/\^(.*)\$\//, '$1')}) : [];
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
    
    var timerId = null;
    
    /**
     * 補完機能初期化
     * 
     * @param {string} featureDirectory featuresディレクトリのパス
     */
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
    //=======================================
    // ここまでbehat用の補完機能
    //=======================================
    

    /**
     * addon/dialog/dialog.js拡張
     * blurイベントではダイアログを閉じなくする
     */
    var o = CodeMirror.prototype.openDialog;
    CodeMirror.defineExtension('openDialog', function(template, callback, options) { 
        var close = o.call(this, template, callback, options),
            closeWrapper = function () {
                close();
                CodeMirror.off(angular.element('.CodeMirror-scroll').get(0), 'click', closeWrapper);
            };
        CodeMirror.off(angular.element('.CodeMirror-dialog input').get(0), 'blur', close);
        CodeMirror.on(angular.element('.CodeMirror-scroll').get(0), 'click', closeWrapper);
        return close;
    });
    
    return {
        'insertTab': insertTab,
        'autocomplete': autocomplete,
        'changeMode': changeMode,
        'initBehatHint': initBehatHint
    };
});

