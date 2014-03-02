angular.module('winbehat').controller('directoryTreeController', [
  '$scope',
  'filelistService',
  'editFilelistService',
  function ($scope, filelistService, editFilelistService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    /**
     * ディレクトリの階層情報を読み込む
     * 
     * @param {object} element
     */
    $scope.openDirectory = function (element) {
      if (!element.files[0]) {
        return;
      }
      filelistService.read(element.files[0].path, function (filelist) {
        $scope.$apply(function () {
          if (filelist) {
            $scope.filelist = filelist;
          }
          $scope.hasFilelist = true;
        });
      });
    };
    /**
     * ツリーの要素をクリックした時の動作
     * 
     * @param {object} element
     * @param {number} index
     */
    $scope.clickNode = function (element, index) {
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
        editFilelistService.push(element.item.name);
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
      window.dispatchEvent(new Event('resize'));
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
]);