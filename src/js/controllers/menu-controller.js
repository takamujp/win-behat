
angular.module('winbehat').controller('menuController', function ($scope, $rootScope) {
    var CATEGORY = {
        FILE: 'ファイル',
        BEHAT: 'behat'
    };
    
    var ACTION = {
        OPEN_PROJECT: 'プロジェクトを開く',
        RUN: '実行',
        SNIPPETS: '未定義のスニペットを表示'
    };
    
    $scope.menuItems = [
        {
            label: CATEGORY.FILE,
            items: [
                {label: ACTION.OPEN_PROJECT}
            ]
        },
        {
            label: CATEGORY.BEHAT,
            items: [
                {label: ACTION.RUN},
                {label: ACTION.SNIPPETS}
            ]
        }
    ];
    
    $scope.clickItem = function (category, action) {
        
        if (category == CATEGORY.FILE) {
            switch (action) {
                case ACTION.OPEN_PROJECT:
                    setTimeout(function() {
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
});
