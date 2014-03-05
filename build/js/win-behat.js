angular.module('winbehat', ['ui.codemirror', 'ui.bootstrap']);;angular.module('winbehat').controller('directoryTreeController', [
  '$scope',
  '$rootScope',
  'filelistService',
  'editFilelistService',
  'modalService',
  'behatService',
  function ($scope, $rootScope, filelistService, editFilelistService, modalService, behatService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.hasFeatures = false;
    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object} element
     */
    $scope.openDirectory = function (element) {
      if (!element.files[0]) {
        return;
      }
      // ディレクトリ直下のファイルの一覧を取得する
      filelistService.read(element.files[0].path, function (filelist) {
        var i = 0, len = 0, hasFeatures = false;
        if (filelist) {
          for (i = 0, len = filelist.children.length; i < len; i++) {
            if (filelist.children[i].name.split('\\').pop() == 'features') {
              hasFeatures = true;
              break;
            }
          }
          // featuresディレクトリが存在するならそのまま、ツリーに表示させる
          if (hasFeatures) {
            $scope.$apply(function () {
              $scope.filelist = filelist;
              $scope.hasFilelist = true;
            });
          }  // 存在しない場合
          else {
            modalInstance = modalService.openModal('template/modal/confirm.html', false, {
              'yesLabel': '\u306f\u3044',
              'noLabel': '\u3044\u3044\u3048',
              'hideCancel': true,
              'title': 'behat --init \u5b9f\u884c\u78ba\u8a8d',
              'message': '\u76f4\u4e0b\u306bfeatures\u30c7\u30a3\u30ec\u30af\u30c8\u30ea\u304c\u5b58\u5728\u3057\u306a\u3051\u308c\u3070\u958b\u304f\u3053\u3068\u304c\u3067\u304d\u307e\u305b\u3093\u3002\u4f5c\u6210\u3057\u307e\u3059\u304b\uff1f'
            });
            modalInstance.result.then(function (result) {
              if (result.selected == 'ok') {
                behatService.init(filelist.name, function (err, stdout, stderr) {
                  if (err) {
                    modalService.openModal('template/modal/error.html', true, {
                      title: 'behat --init \u30a8\u30e9\u30fc',
                      message: stderr || err.message
                    });
                    return;
                  }
                  $scope.openDirectory(element);
                });
              }
            });
          }
        }
      });
    };
    /**
     * ツリーの要素をクリックした時の動作
     * 
     * @param {object} element
     * @param {number} index
     */
    $scope.clickNode = function (element, index) {
      var result = null;
      // ディレクトリなら表示を切り替える
      if (element.item.isDirectory) {
        if (element.item.isOpen) {
          element.item.isShow = !element.item.isShow;
        } else {
          filelistService.read(element.item.name, function (filelist) {
            $scope.$apply(function () {
              if (filelist) {
                element.item.children = filelist.children;
              }
              element.item.isOpen = true;
              element.item.isShow = true;
            });
          });
        }
      } else {
        // ファイルならエディタを開く
        result = editFilelistService.push(element.item.name);
        if (result !== true) {
          if (typeof result == 'number') {
            $rootScope.$broadcast('selectAlreadyOpenFile', result);
          } else {
            modalService.openModal('template/modal/error.html', true, {
              title: '\u30d5\u30a1\u30a4\u30eb\u8aad\u307f\u8fbc\u307f\u30a8\u30e9\u30fc',
              message: result.message
            });
          }
        }
      }
    };
    /**
     * アイコンのクラスを取得する
     * 
     * @param {object} element
     * @returns {object} ng-class用オブジェクト
     */
    $scope.getIconClass = function (element) {
      return {
        'icon-expand-directory': element.item.isDirectory && element.item.isShow,
        'icon-contract-directory': element.item.isDirectory && !element.item.isShow,
        'icon-file': !element.item.isDirectory,
        'tree-icon': true
      };
    };
  }
]);angular.module('winbehat').controller('menuController', [
  '$scope',
  '$rootScope',
  function ($scope, $rootScope) {
    var CATEGORY = { FILE: '\u30d5\u30a1\u30a4\u30eb' };
    var ACTION = { OPEN_PROJECT: '\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u958b\u304f' };
    $scope.menuItems = [{
        label: CATEGORY.FILE,
        items: [{ label: ACTION.OPEN_PROJECT }]
      }];
    $scope.clickItem = function (category, action) {
      if (category == CATEGORY.FILE) {
        switch (action) {
        case ACTION.OPEN_PROJECT:
          setTimeout(function () {
            document.querySelector('#dir-dialog').click();
          }, 0);
          break;
        default:
          break;
        }
      }
    };
  }
]);angular.module('winbehat').controller('textEditorController', [
  '$scope',
  'codeMirrorService',
  'editFilelistService',
  'modalService',
  function ($scope, codeMirrorService, editFilelistService, modalService) {
    $scope.editFilelist = editFilelistService.list;
    $scope.editFileCount = 0;
    $scope.editFile = {};
    $scope.codeMirror = {};
    $scope.editorOptions = {
      theme: 'mbo',
      lineNumbers: true,
      indentUnit: 4,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      autoCloseTags: true,
      styleSelectedText: true,
      styleActiveLine: true,
      continueComments: true,
      mode: null,
      extraKeys: {
        'Ctrl-/': 'toggleComment',
        'Tab': codeMirrorService.insertTab,
        'Ctrl-Space': codeMirrorService.autocomplete,
        'Ctrl-S': function () {
          save();
        }
      },
      onLoad: function (cm) {
        $scope.codeMirror = cm;
      }
    };
    /**
     * 編集中のファイルを監視,ファイルが増えた時にそのファイルを選択中にする
     */
    $scope.$watchCollection('editFilelist', function (list) {
      var len = list.length;
      if (len > $scope.editFileCount) {
        $scope.select(len - 1);
        // 更新されたかを判定するために、読み込み時のテキストを記憶しておく
        // CodeMirrorに値をセットする前と後で比較すると別の文字列と判定されてしまうので、一度CodeMirrorにセットしてその値を記憶させる。
        $scope.codeMirror.doc.setValue($scope.editFile.text);
        $scope.editFile.lastText = $scope.codeMirror.doc.getValue();
      }
      $scope.editFileCount = len;
    });
    /**
     * タブを太字で表示するかどうかを判定する
     * 
     * @param {object} file
     */
    $scope.isBold = function (file) {
      return { 'bold': file.isChanged() };
    };
    /**
     * タブ選択
     * 
     * @param {number} index
     */
    $scope.select = function (index) {
      var prev = $scope.editFile, selected = editFilelistService.select(index) || { text: '' }, removeLastHistory = null;
      if (prev.path == selected.path) {
        return;
      }
      window.dispatchEvent(new Event('changeTab'));
      $scope.editFile = selected;
      $scope.codeMirror.setOption('mode', selected.mode || '');
      selected.mode && CodeMirror.autoLoadMode($scope.codeMirror, selected.mode);
      // 「space」を入力すると何故か$scope.editFile.textがundefinedになり、
      // タブ切り替えで元のタブに戻した時にテキストが表示されなくなってしまうので、
      // このタイミングでtextをCodeMirrorから取得しておく
      prev.text = $scope.codeMirror.getValue();
      // タブを切り替えた時にredo,undoが正常に動作するように、ファイルごとにhistoryを覚えさせる
      if (prev.path) {
        prev.history = $scope.codeMirror.getHistory();
      }
      $scope.codeMirror.clearHistory();
      if ($scope.editFile.history) {
        $scope.codeMirror.setHistory($scope.editFile.history);
      }
      // 「前のタブのテキストから現在のタブのテキストへの変更」がhistoryに保存されるため、
      // hisotryの変更を監視して、最新のhistoryを1件削除する。
      removeLastHistory = $scope.$watch('codeMirror.doc.history', function () {
        $scope.codeMirror.doc.history.done.pop();
        removeLastHistory();  // 削除したら監視解除
      });
    };
    $scope.$on('selectAlreadyOpenFile', function (event, id) {
      $scope.select(id);
    });
    /**
     * ファイルを閉じる
     * 
     * @param {number} index
     */
    $scope.close = function (index) {
      var modalInstance = null, close = function () {
          var file = editFilelistService.remove(index);
          if (file.path == $scope.editFile.path) {
            $scope.select(index - 1);
          }
        };
      if ($scope.editFilelist[index].text != $scope.editFilelist[index].lastText) {
        modalInstance = modalService.openModal('template/modal/confirm.html', false, {
          'yesLabel': '\u4fdd\u5b58\u3057\u3066\u9589\u3058\u308b',
          'noLabel': '\u4fdd\u5b58\u305b\u305a\u306b\u9589\u3058\u308b',
          'cancelLabel': '\u30ad\u30e3\u30f3\u30bb\u30eb',
          'title': '\u4fdd\u5b58\u306e\u78ba\u8a8d',
          'message': '\u30d5\u30a1\u30a4\u30eb\u306f\u5909\u66f4\u3055\u308c\u3066\u3044\u307e\u3059\u3002\u4fdd\u5b58\u3057\u307e\u3059\u304b\uff1f'
        });
        modalInstance.result.then(function (result) {
          if (result.selected == 'ok') {
            save(function (err) {
              if (err) {
                modalService.openModal('template/modal/error.html', true, {
                  title: '\u30d5\u30a1\u30a4\u30eb\u4fdd\u5b58\u30a8\u30e9\u30fc',
                  message: '\u30d5\u30a1\u30a4\u30eb\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002'
                });
                return;
              }
              close();
              $scope.$apply();
            });
          } else if (result.selected == 'no') {
            close();
          }
        });
      } else {
        close();
      }
    };
    /**
     * ファイルを保存する
     * 
     * @param {object} file
     */
    var save = function (callback) {
      if (!$scope.editFile.path || !$scope.editFile.isChanged()) {
        return;
      }
      $scope.editFile.text = $scope.codeMirror.getValue();
      callback = callback || function (err) {
        if (err) {
          modalService.openModal('template/modal/error.html', true, {
            title: '\u30d5\u30a1\u30a4\u30eb\u4fdd\u5b58\u30a8\u30e9\u30fc',
            message: '\u30d5\u30a1\u30a4\u30eb\u306e\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002'
          });
          return;
        }
        $scope.$apply();
      };
      $scope.editFile.save(callback);
    };
  }
]);;angular.module('winbehat').directive('context', function () {
  var contexts = [];
  var hide = function () {
    for (var key in contexts) {
      contexts[key].css({ 'display': 'none' });
    }
  };
  return {
    restrict: 'A',
    scope: '@&',
    compile: function compile(tElement, tAttrs, transclude) {
      return {
        post: function postLink(scope, iElement, iAttrs, controller) {
          var ul = $('#' + iAttrs.context), last = null;
          ul.css({ 'display': 'none' });
          contexts[iAttrs.context] = ul;
          $(iElement).on('contextmenu', function (event) {
            angular.element($('#directory-tree')).scope().contextTarget = scope.file.children[scope.$index];
            hide();
            ul.css({
              position: 'fixed',
              display: 'block',
              left: event.clientX + 'px',
              top: event.clientY + 'px'
            });
            last = event.timeStamp;
            event.stopPropagation();
          });
          $(document).on('click contextmenu', function (event) {
            var target = $(event.target);
            if (!target.is('.popover') && !target.parents().is('.popover')) {
              if (last === event.timeStamp) {
                return;
              }
              ul.css({ 'display': 'none' });
            }
          });
        }
      };
    }
  };
});angular.module('winbehat').directive('dirctoryTreeNode', [
  '$compile',
  function ($compile) {
    return {
      restrict: 'E',
      replace: true,
      scope: { file: '=' },
      templateUrl: 'template/directory-tree-node.html',
      controller: 'directoryTreeController',
      compile: function (element) {
        var contents = element.contents().remove();
        var compiled;
        return function (scope, element) {
          if (!compiled) {
            compiled = $compile(contents);
          }
          compiled(scope, function (clone) {
            element.append(clone);
          });
        };
      }
    };
  }
]);angular.module('winbehat').directive('resizeWindow', [
  '$window',
  function ($window) {
    return function ($scope) {
      var editor_tabs = document.querySelector('#editor-tabs');
      $scope.windowHeight = 0;
      $scope.windowWidth = 0;
      $scope.editorHeight = 0;
      $scope.menuHeight = 0;
      $scope.initializeWindowSize = function () {
        $scope.windowHeight = $window.innerHeight;
        $scope.windowWidth = $window.innerWidth;
        $scope.editorHeight = $window.innerHeight - editor_tabs.clientHeight - 28;
        $scope.menuHeight = $window.innerHeight - 28;
      };
      $scope.initializeWindowSize();
      $scope.$watchCollection('editFilelist', function () {
        $scope.initializeWindowSize();
      });
      angular.element($window).bind('resize', function () {
        $scope.initializeWindowSize();
        return $scope.$apply();
      });
      angular.element($window).bind('changeTab', function () {
        $scope.initializeWindowSize();
      });
    };
  }
]);;angular.module('winbehat').factory('behatService', function () {
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
    if (!fs.existsSync(file_path)) {
      return new Error(file_path + ' not found.');
    }
    text = fs.readFileSync(file_path, { encoding: 'utf-8' });
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