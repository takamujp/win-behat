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
  function ($scope, codeMirrorService, editFilelistService) {
    $scope.editFilelist = editFilelistService.list;
    $scope.editFile = {};
    $scope.codeMirror = {};
    $scope.editorOptions = {
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
      },
      onLoad: function (cm) {
        $scope.codeMirror = cm;
      }
    };
    $scope.$watchCollection('editFilelist', function (list) {
      var len = list.length;
      if (len) {
        $scope.select(len - 1);
        updateLastText();
      }
    });
    $scope.isBold = function (file) {
      return { 'bold': file.text != file.lastText };
    };
    /**
     * タブ選択
     * 
     * @param {number} index
     */
    $scope.select = function (index) {
      $scope.editFile = editFilelistService.select(index) || { text: '' };
    };
    /**
     * ファイルを閉じる
     * 
     * @param {number} index
     */
    $scope.remove = function (index) {
      editFilelistService.remove(index);
      $scope.select(index - 1);
    };
    var updateLastText = function () {
      // 更新されたかを判定するために、読み込み時のテキストを記憶しておく
      // CodeMirrorに値をセットする前と後で比較すると別の文字列と判定されてしまうので、
      // 一度CodeMirrorにセットしてその値を記憶させておく。
      $scope.codeMirror.doc.setValue($scope.editFile.text);
      $scope.editFile.lastText = $scope.codeMirror.doc.getValue();
    };
  }
]);