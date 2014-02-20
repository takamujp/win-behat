angular.module('winbehat').controller('directoryTreeController', [
  '$scope',
  'filelistService',
  function ($scope, filelistService) {
    $scope.filelist = {};
    $scope.hasFilelist = false;
    $scope.openDirectory = function (element) {
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
     * @param {number} id
     */
    $scope.clickNode = function (element, id) {
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
  function ($scope) {
    $scope.editorOptions = {
      lineWrapping: true,
      lineNumbers: true,
      indentUnit: 4,
      indentWithTabs: false,
      extraKeys: {
        Tab: function (cm) {
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
        }
      }
    };
  }
]);