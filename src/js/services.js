angular.module('winbehat').factory('behatService', function () {
  return require('./js/my-modules/behat');
});angular.module('winbehat').factory('codeMirrorService', function () {
  var fxl = require('./js/my-modules/filename-extension-list');
  /**
     * タブを挿入する
     * 
     * @param {CodeMirror} cm
     */
  var insertTab = function (cm) {
    var indent_unit = cm.getOption('indentUnit'), spaces = '', sel = cm.doc.sel, from = sel.from, to = sel.to, line_no = 0, len = 0, replaced = [], start = {
        line: 0,
        ch: 0
      }, end = {
        line: 0,
        ch: 0
      };
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
    cm.setOption('mode', fxl[ext]);
  };
  return {
    'insertTab': insertTab,
    'autocomplete': autocomplete,
    'changeMode': changeMode
  };
});angular.module('winbehat').factory('editFilelistService', function () {
  var fs = require('fs'), path = require('path'), ext_list = require('./js/my-modules/filename-extension-list'), list = [];
  var push = function (file_path) {
    var text = '', i = 0, len = list.length;
    for (; i < len; i++) {
      if (list[i].path === file_path) {
        return i;
        break;
      }
    }
    text = fs.readFileSync(file_path).toString();
    list.push({
      path: file_path,
      name: file_path.split('\\').pop(),
      isSelected: false,
      text: text,
      lastText: '',
      history: null,
      mode: ext_list[path.extname(file_path).split('.').pop()],
      save: function (callback) {
        if (this.text == null) {
          callback && callback(new Error('text undefined'));
          return;
        }
        fs.writeFile(this.path, this.text, function (err) {
          if (err && callback) {
            callback(err);
            return;
          }
          this.lastText = this.text;
          callback && callback();
        }.bind(this));
      },
      isChanged: function () {
        return this.text != this.lastText;
      }
    });
    return true;
  };
  var remove = function (id) {
    return list.splice(id, 1)[0];
  };
  var select = function (id) {
    var i = 0, len = list.length;
    if (id < 0) {
      id = 0;
    } else if (id >= len) {
      id = len - 1;
    }
    for (; i < len; i++) {
      list[i].isSelected = false;
    }
    list[id] && (list[id].isSelected = true);
    return list[id];
  };
  return {
    list: list,
    push: push,
    remove: remove,
    select: select
  };
});angular.module('winbehat').factory('filelistService', function () {
  return require('./js/my-modules/filelist');
});angular.module('winbehat').factory('modalService', [
  '$modal',
  function ($modal) {
    /**
     * モーダルを開く
     * 
     * @param {string} template テンプレートファイルのパス または テンプレート文字列
     * @param {bool} backdrop モーダル外をクリックした時に画面を ture:閉じる, false:閉じない
     * @param {object} params モーダルのコントローラに渡すパラメータ
     */
    var openModal = function (template, backdrop, params) {
      return $modal.open({
        templateUrl: template,
        controller: function ($scope, $modalInstance, params) {
          $scope.params = params || {};
          $scope.init && $scope.init($scope);
          $scope.ok = params.ok || function () {
            $modalInstance.close(params);
          };
          $scope.yes = params.yes || function () {
            $modalInstance.close({
              selected: 'ok',
              params: params
            });
          };
          $scope.no = params.no || function () {
            $modalInstance.close({
              selected: 'no',
              params: params
            });
          };
          $scope.cancel = params.cancel || function () {
            $modalInstance.dismiss('cancel');
          };
        },
        backdrop: backdrop || false,
        resolve: {
          params: function () {
            return params;
          }
        }
      });
    };
    return { openModal: openModal };
  }
]);