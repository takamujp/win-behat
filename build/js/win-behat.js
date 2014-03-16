angular.module('winbehat', ['ui.codemirror', 'ui.bootstrap']);;angular.module('winbehat').controller('directoryTreeController', [
  '$scope',
  '$rootScope',
  '$window',
  'filelistService',
  'editFilelistService',
  'modalService',
  'behatService',
  'codeMirrorService',
  function ($scope, $rootScope, $window, filelistService, editFilelistService, modalService, behatService, codeMirrorService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.hasFeatures = false;
    var fs = require('fs'), path = require('path'), PROHIBITED_CHARACTER = /[\\\/\:\*\?"<>\|]/g;
    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object} element
     */
    $scope.openDirectory = function (element) {
      if (!element.files[0]) {
        return;
      }
      $scope.hasFilelist = false;
      $scope.hasFeatures = false;
      // ディレクトリ直下のファイルの一覧を取得する
      filelistService.read(element.files[0].path, null, function (filelist) {
        var i = 0, len = 0, hasFeatures = false, modalInstance = null;
        if (filelist) {
          for (i = 0, len = filelist.children.length; i < len; i++) {
            if (filelist.children[i].name == 'features') {
              hasFeatures = true;
              break;
            }
          }
          // featuresディレクトリが存在するならそのまま、ツリーに表示させる
          if (hasFeatures) {
            $scope.$apply(function () {
              $scope.filelist = filelist;
              $scope.hasFilelist = true;
              $scope.hasFeatures = true;
            });
            codeMirrorService.initBehatHint(path.join(filelist.path(), 'features\\bootstrap'));
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
                behatService.init(filelist.path(), function (err, stdout, stderr) {
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
      var result = null, isDir = false;
      // ディレクトリなら表示を切り替える
      try {
        isDir = element.item.isDirectory();
      } catch (e) {
        element.item.parent.children.splice(index, 1);
        return;
      }
      if (isDir) {
        if (element.item.isOpen) {
          element.item.isShow = !element.item.isShow;
        } else {
          _readDirectory(element.item);
        }
      } else {
        // ファイルならエディタを開く
        result = editFilelistService.push(element.item);
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
     * ディレクトリの子要素を読み込む
     * 
     * @param {object} directory
     */
    var _readDirectory = function (directory) {
      filelistService.read(directory.path(), null, function (filelist) {
        $scope.$apply(function () {
          if (filelist) {
            directory.children = filelist.children;
          }
          directory.isOpen = true;
          directory.isShow = true;
        });
      });
    };
    /**
     * アイコンのクラスを取得する
     * 
     * @param {object} element
     * @returns {object} ng-class用オブジェクト
     */
    $scope.getIconClass = function (element) {
      return {
        'icon-expand-directory': element.item.isDirectory() && element.item.isShow,
        'icon-contract-directory': element.item.isDirectory() && !element.item.isShow,
        'icon-file': !element.item.isDirectory(),
        'tree-icon': true
      };
    };
    /**
     * ファイルを削除する
     */
    $scope.deleteFile = function () {
      var modalInstance = null;
      modalInstance = modalService.openModal('template/modal/confirm.html', false, {
        'yesLabel': '\u306f\u3044',
        'noLabel': '\u3044\u3044\u3048',
        'hideCancel': true,
        'title': '\u30d5\u30a1\u30a4\u30eb\u524a\u9664\u78ba\u8a8d',
        'message': '\u30d5\u30a1\u30a4\u30eb\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f'
      });
      modalInstance.result.then(function (result) {
        if (result.selected == 'ok') {
          $scope.contextTarget.file.delete(function (err) {
            if (err) {
              modalService.openModal('template/modal/error.html', true, {
                title: '\u30d5\u30a1\u30a4\u30eb\u524a\u9664\u30a8\u30e9\u30fc',
                message: err.message
              });
              return;
            }
            var id = editFilelistService.getId($scope.contextTarget.file.path());
            if (id >= 0) {
              $rootScope.$broadcast('deleteAlreadyOpenFile', id);
            }
            $scope.$apply();
          });
        }
      });
    };
    /**
     * ファイル名を変更する
     */
    $scope.renameFile = function () {
      var modalInstance = null;
      modalInstance = modalService.openModal('template/modal/input.html', false, {
        title: '\u30d5\u30a1\u30a4\u30eb\u540d\u5909\u66f4',
        label: '\u30d5\u30a1\u30a4\u30eb\u540d',
        inputValue: $scope.contextTarget.file.name
      });
      modalInstance.result.then(function (result) {
        if (result.selected == 'ok' && result.params.inputValue) {
          $scope.contextTarget.file.rename(result.params.inputValue, function (err) {
            if (err) {
              modalService.openModal('template/modal/error.html', true, {
                title: '\u30d5\u30a1\u30a4\u30eb\u540d\u5909\u66f4\u30a8\u30e9\u30fc',
                message: err.message
              });
              return;
            }
            $scope.$apply();
          });
        }
      });
    };
    /**
     * 新規ファイル作成
     */
    $scope.createFile = function () {
      var modalInstance = null;
      modalInstance = modalService.openModal('template/modal/input.html', false, {
        title: '\u65b0\u898f\u30d5\u30a1\u30a4\u30eb\u4f5c\u6210',
        label: '\u30d5\u30a1\u30a4\u30eb\u540d'
      });
      modalInstance.result.then(function (result) {
        if (result.selected == 'ok' && result.params.inputValue) {
          $scope.contextTarget.file.createChildFile(result.params.inputValue, '', function (err) {
            if (err) {
              modalService.openModal('template/modal/error.html', true, {
                title: '\u65b0\u898f\u30d5\u30a1\u30a4\u30eb\u4f5c\u6210\u30a8\u30e9\u30fc',
                message: err.message
              });
            }
            $scope.$apply();
          });
        }
      });
    };
    /**
     * 新規ディレクトリ作成
     */
    $scope.createDirectory = function () {
      var modalInstance = null;
      modalInstance = modalService.openModal('template/modal/input.html', false, {
        title: '\u65b0\u898f\u30c7\u30a3\u30ec\u30af\u30c8\u30ea\u4f5c\u6210',
        label: '\u30c7\u30a3\u30ec\u30af\u30c8\u30ea\u540d'
      });
      modalInstance.result.then(function (result) {
        if (result.selected == 'ok' && result.params.inputValue) {
          $scope.contextTarget.file.createChildDirectory(result.params.inputValue, function (err) {
            if (err) {
              modalService.openModal('template/modal/error.html', true, {
                title: '\u65b0\u898f\u30c7\u30a3\u30ec\u30af\u30c8\u30ea\u4f5c\u6210\u30a8\u30e9\u30fc',
                message: err.message
              });
              return;
            }
            $scope.$apply();
          });
        }
      });
    };
    /**
     * behat実行
     * 
     * @param {string} features 実行対象のfeatureファイル・ディレクトリのパス
     */
    var _runBehat = function (features) {
      if (!$scope.hasFeatures) {
        return;
      }
      behatService.showHtmlResults($scope.filelist.name, features);
    };
    /**
     * behat実行(contextメニューから)
     */
    $scope.runBehat = function () {
      _runBehat($scope.contextTarget.file.path());
    };
    /**
     * behat実行(イベントが発行されたら)
     */
    $scope.$on('runBehat', function (event, features) {
      features = features || '';
      _runBehat(features);
    });
    /**
     * behatを実行して、未定義のステップを表示する
     * 
     * @param {string} features 実行対象のfeatureファイル・ディレクトリのパス
     */
    var _showSnippets = function (features) {
      if (!$scope.hasFeatures) {
        return;
      }
      behatService.showSnippets($scope.filelist.name, features);
    };
    /**
     * 未定義のステップを表示する(contextメニューから)
     */
    $scope.showSnippets = function () {
      _showSnippets($scope.contextTarget.file.path());
    };
    /**
     * 未定義のステップを表示する(イベントが発行されたら)
     */
    $scope.$on('showSnippets', function (event, features) {
      features = features || '';
      _showSnippets(features);
    });
    $scope.refreshFolder = function () {
      var parent = $scope.contextTarget.parent, index = $scope.contextTarget.index, file = $scope.contextTarget.file;
      if (!file.isDirectory() || !file.isOpen) {
        return;
      }
      filelistService.read(file.path(), null, function (filelist) {
        if (filelist) {
          file.children = filelist.children;
        } else {
          parent.children.splice(index, 1);
        }
        $scope.$apply();
      });
    };
  }
]);angular.module('winbehat').controller('menuController', [
  '$scope',
  '$rootScope',
  function ($scope, $rootScope) {
    var CATEGORY = {
        FILE: '\u30d5\u30a1\u30a4\u30eb',
        BEHAT: 'behat'
      };
    var ACTION = {
        OPEN_PROJECT: '\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u958b\u304f',
        RUN: '\u5b9f\u884c',
        SNIPPETS: '\u672a\u5b9a\u7fa9\u306e\u30b9\u30cb\u30da\u30c3\u30c8\u3092\u8868\u793a'
      };
    $scope.menuItems = [
      {
        label: CATEGORY.FILE,
        items: [{ label: ACTION.OPEN_PROJECT }]
      },
      {
        label: CATEGORY.BEHAT,
        items: [
          { label: ACTION.RUN },
          { label: ACTION.SNIPPETS }
        ]
      }
    ];
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
      if (category == CATEGORY.BEHAT) {
        switch (action) {
        case ACTION.RUN:
          $rootScope.$broadcast('runBehat');
          break;
        case ACTION.SNIPPETS:
          $rootScope.$broadcast('showSnippets');
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
  'behatService',
  function ($scope, codeMirrorService, editFilelistService, modalService, behatService) {
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
          _save();
        },
        'Ctrl-B': function () {
          _runBehat();
        },
        'Shift-Ctrl-B': function () {
          _showSnippets();
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
      return { 'bold': $scope.editFile == file ? file.lastText != $scope.codeMirror.getValue() : file.isChanged() };
    };
    /**
     * タブ選択
     * 
     * @param {number} index
     */
    $scope.select = function (index) {
      var prev = $scope.editFile, selected = editFilelistService.select(index) || { text: '' }, removeLastHistory = null;
      if (prev.path && selected.path && prev.path() == selected.path()) {
        return;
      }
      window.dispatchEvent(new Event('changeTab'));
      $scope.editFile = selected;
      // modeによってCodeMirrorのオプションを切り替える
      $scope.codeMirror.setOption('mode', selected.mode || '');
      selected.mode && CodeMirror.autoLoadMode($scope.codeMirror, selected.mode);
      $scope.codeMirror.setOption('indentUnit', selected.mode == 'gherkin' ? 2 : 4);
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
    $scope.$on('deleteAlreadyOpenFile', function (event, id) {
      $scope.editFilelist[id].lastText = $scope.editFilelist[id].text;
      $scope.close(id);
      $scope.$apply();
    });
    /**
     * ファイルを閉じる
     * 
     * @param {number} index
     */
    $scope.close = function (index) {
      var modalInstance = null,
        // 保存直後に編集中のファイルを閉じようとすると、何故か$scope.editFile.textが空の文字列になる場合があるので、その場合はcodeMirrorの現在の値と比較するようにする
        text = $scope.editFilelist[index] == $scope.editFile ? $scope.codeMirror.getValue() : $scope.editFilelist[index].text, close = function () {
          var file = editFilelistService.remove(index);
          if (file.file.path() == $scope.editFile.file.path()) {
            $scope.select(index - 1);
          }
        };
      if (text != $scope.editFilelist[index].lastText) {
        modalInstance = modalService.openModal('template/modal/confirm.html', false, {
          'yesLabel': '\u4fdd\u5b58\u3057\u3066\u9589\u3058\u308b',
          'noLabel': '\u4fdd\u5b58\u305b\u305a\u306b\u9589\u3058\u308b',
          'cancelLabel': '\u30ad\u30e3\u30f3\u30bb\u30eb',
          'title': '\u4fdd\u5b58\u306e\u78ba\u8a8d',
          'message': '\u30d5\u30a1\u30a4\u30eb\u306f\u5909\u66f4\u3055\u308c\u3066\u3044\u307e\u3059\u3002\u4fdd\u5b58\u3057\u307e\u3059\u304b\uff1f'
        });
        modalInstance.result.then(function (result) {
          if (result.selected == 'ok') {
            _save(function (err) {
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
    var _save = function (callback) {
      if (!$scope.editFile.file || $scope.editFile.lastText == $scope.codeMirror.getValue()) {
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
    /**
     * 編集中のファイルでbehatを実行する
     */
    var _runBehat = function () {
      if (!$scope.editFile.file.path()) {
        return;
      }
      behatService.showHtmlResults($scope.editFile.file.path().split('features')[0], $scope.editFile.file.path());
    };
    /**
     * 編集中のファイルのスニペットを表示する
     */
    var _showSnippets = function () {
      if (!$scope.editFile.file.path()) {
        return;
      }
      behatService.showSnippets($scope.editFile.file.path().split('features')[0], $scope.editFile.file.path());
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
            hide();
            if (!scope.file) {
              return;
            }
            angular.element($('#directory-tree')).scope().contextTarget = {
              parent: scope.file,
              index: scope.$index,
              file: scope.file.children[scope.$index]
            };
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
]);;angular.module('winbehat').factory('behatService', [
  '$window',
  'modalService',
  function ($window, modalService) {
    var fs = require('fs'), behat = require('./js/my-modules/behat'), gui = require('nw.gui'), TMP_PATH = 'tmp/', PROHIBITED_CHARACTER = /[\\\/\:\*\?"<>\|]/g;
    /**
     * windowをblankで開く
     * 
     * @param {string} message 表示する内容(html5)
     */
    var _openBlankWindow = function (message) {
      var win = $window.open('', '_blank');
      $(win.document.body).html(message);
    };
    /**
     * behatを実行し、その結果を別ウィンドウに表示する
     * 
     * @param {string} project_dir　behatを実行するディレクトリ
     * @param {string} features 実行対象のfeatureファイルのパス・featureファイルのディレクトリのパス
     */
    behat.showHtmlResults = function (project_dir, features) {
      behat.run(project_dir, '-f html', features, function (err, stdout, stderr) {
        var filename = '';
        if (err) {
          if (stdout) {
            if (stdout.indexOf('<!DOCTYPE html')) {
              _openBlankWindow('<pre>' + stdout + '</pre>');
              return;
            }
          } else {
            modalService.openModal('template/modal/error.html', true, {
              title: 'behat\u5b9f\u884c\u30a8\u30e9\u30fc',
              message: stderr || err.message
            });
            return;
          }
        }
        filename = TMP_PATH + (project_dir + features + '.html').replace(PROHIBITED_CHARACTER, '');
        var faildCreateFile = function () {
          fs.unlink('build/' + filename, function (err) {
          });
          _openBlankWindow(stdout);
        };
        fs.open('build/' + filename, 'w', '0777', function (err, fd) {
          if (err) {
            faildCreateFile();
            return;
          }
          fs.write(fd, new Buffer(stdout), 0, Buffer.byteLength(stdout), function (err) {
            var win = null;
            fs.close(fd);
            if (err) {
              faildCreateFile();
              return;
            }
            win = gui.Window.get($window.open(filename));
            win.on('closed', function () {
              win = null;
              fs.unlink('build/' + filename, function (err) {
              });
            });
          });
        });
      });
    };
    /**
     * 未定義のスニペットを別ウィンドウに表示する
     * 
     * @param {string} project_dir　behatを実行するディレクトリ
     * @param {string} features 実行対象のfeatureファイルのパス・featureファイルのディレクトリのパス
     */
    behat.showSnippets = function (project_dir, features) {
      behat.run(project_dir, '-f snippets', features, function (err, stdout, stderr) {
        if (err && !stdout) {
          modalService.openModal('template/modal/error.html', true, {
            title: 'behat\u5b9f\u884c\u30a8\u30e9\u30fc',
            message: stderr || err.message
          });
          return;
        }
        if (stdout.replace(/[\n|\r]/g, '')) {
          _openBlankWindow('<pre>' + stdout + '</pre>');
        } else {
          modalService.openModal('template/modal/error.html', true, {
            title: '\u30b9\u30c6\u30c3\u30d7\u8868\u793a\u30a8\u30e9\u30fc',
            message: '\u672a\u5b9a\u7fa9\u306e\u30b9\u30c6\u30c3\u30d7\u306f\u3042\u308a\u307e\u305b\u3093\u3067\u3057\u305f'
          });
        }
      });
    };
    return behat;
  }
]);angular.module('winbehat').factory('codeMirrorService', function () {
  var fxl = require('./js/my-modules/filename-extension-list');
  var fs = require('fs');
  var path = require('path');
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
  //=======================================
  // behat用の補完機能
  //=======================================
  var behatContexts = {};
  var behatWords = '# language: ja,\u30d5\u30a3\u30fc\u30c1\u30e3,\u30b7\u30ca\u30ea\u30aa,\u524d\u63d0,\u304b\u3064,\u3082\u3057,\u306a\u3089\u3070'.split(',');
  CodeMirror.gherkinHint = gherkinHint;
  // deprecated
  CodeMirror.registerHelper('hint', 'gherkin', gherkinHint);
  var WORD = /[\S]+/;
  function gherkinHint(editor, options) {
    var word = options && options.word || WORD, cur = editor.getCursor(), curLine = editor.getLine(cur.line), start = cur.ch, end = start, curWord = false, list = [], behatSnippets = getSnippets();
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
    for (var i = 0, len = behatSnippets.length; i < len; i++) {
      if (!curWord || behatSnippets[i].indexOf(curWord, 0) != -1) {
        //             if (!curWord || behatSteps[i].lastIndexOf(curWord, 0) == 0) {
        list.push(behatSnippets[i]);
      }
    }
    return {
      list: list.concat(anyWordHint(editor, options)),
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end)
    };
  }
  ;
  function getSnippets() {
    var steps = [];
    for (var key in behatContexts) {
      Array.prototype.push.apply(steps, behatContexts[key]);
    }
    return steps.sort(function (a, b) {
      return a > b ? 1 : -1;
    });
  }
  function anyWordHint(editor, options) {
    var word = options && options.word || /[\w$]+/, range = options && options.range || 500, cur = editor.getCursor(), curLine = editor.getLine(cur.line), start = cur.ch, end = start, curWord = false, list = [], seen = {}, re = null;
    while (end < curLine.length && word.test(curLine.charAt(end))) {
      ++end;
    }
    while (start && word.test(curLine.charAt(start - 1))) {
      --start;
    }
    curWord = start != end && curLine.slice(start, end);
    re = new RegExp(word.source, 'g');
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
  }
  ;
  /**
     * ディレクトリを再帰的に読み込みcontext.phpファイルからスニペットを抽出する
     * 
     * @param {string} base_dir 読み込むディレクトリ
     */
  function readContextFile(base_dir) {
    if (!fs.existsSync(base_dir)) {
      return;
    }
    if (!fs.statSync(base_dir).isDirectory()) {
      if (/.*(Context\.php)$/.test(base_dir)) {
        fs.readFile(base_dir, function (err, data) {
          var matches = data.toString().match(/@Give.*\/\^(.*)\$\//g);
          behatContexts[base_dir] = matches ? matches.map(function (v) {
            return v.replace(/@Give.*\/\^(.*)\$\//, '$1');
          }) : [];
        });
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
      timerId = setTimeout(timer, 30000);
    };
    timer();
  };
  return {
    'insertTab': insertTab,
    'autocomplete': autocomplete,
    'changeMode': changeMode,
    'initBehatHint': initBehatHint
  };
});angular.module('winbehat').factory('editFilelistService', function () {
  var fs = require('fs'), path = require('path'), extList = require('./js/my-modules/filename-extension-list'), list = [];
  var push = function (file) {
    var filePath = file.path(), text = '', i = 0, len = list.length;
    for (; i < len; i++) {
      if (list[i].file.path() === filePath) {
        return i;
        break;
      }
    }
    if (!fs.existsSync(filePath)) {
      return new Error(filePath + ' not found.');
    }
    text = file.readSync();
    list.push({
      file: file,
      isSelected: false,
      text: text,
      lastText: '',
      history: null,
      mode: extList[path.extname(filePath).split('.').pop()],
      save: function (callback) {
        file.write(this.text, function (err) {
          if (err) {
            callback(err);
            return;
          }
          this.lastText = this.text;
          callback();
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
  var rename = function (id, path) {
    list[id].path = path;
    list[id].name = path.split('\\').pop();
  };
  var getId = function (filePath) {
    var i = 0, len = 0;
    for (i = 0, len = list.length; i < len; i++) {
      if (list[i].file.path() == filePath) {
        return i;
      }
    }
    return -1;
  };
  return {
    list: list,
    push: push,
    remove: remove,
    select: select,
    rename: rename,
    getId: getId
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