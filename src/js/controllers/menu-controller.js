
angular.module('winbehat').controller('menuController', function ($scope, $rootScope, $window, modalService) {
    var CATEGORY = {
        FILE: 'ファイル',
        BEHAT: 'behat',
        HELP: 'ヘルプ'
    };
    
    var ACTION = {
        OPEN_PROJECT: 'プロジェクトを開く',
        RUN: '実行',
        STOP_ON_FAILURE: 'behat実行(エラー時中止)',
        SNIPPETS: '未定義のスニペットを表示',
        SHORTCUT: 'ショートカット確認'
    };
    
    $scope.menuItems = [
        {
            label: CATEGORY.FILE,
            items: [
                {label: ACTION.OPEN_PROJECT}
            ]
        },
//        {
//            label: CATEGORY.BEHAT,
//            items: [
//                {label: ACTION.RUN},
//                {label: ACTION.STOP_ON_FAILURE},
//                {label: ACTION.SNIPPETS}
//            ]
//        },
        {
            label: CATEGORY.HELP,
            items: [
                {label: ACTION.SHORTCUT}
            ]
        }
    ];
    
    $scope.clickItem = function (category, action, title) {
        
        if (category == CATEGORY.FILE) {
            switch (action) {
                case ACTION.OPEN_PROJECT:
                    setTimeout(function() {
                        document.querySelector('#dir-dialog').click();
                    }, 0);
                    break;
                default:
                    $rootScope.$broadcast('openDirectory', title);
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
                    
                case ACTION.STOP_ON_FAILURE:
                    $rootScope.$broadcast('runBehat', {features: '', options:['--stop-on-failure']});
                    break;
                    
                default:
                    break;
            }
        }
        
        if (category == CATEGORY.HELP) {
            switch (action) {
                case ACTION.SHORTCUT:
                    modalService.openModal('template/modal/shortcut.html', true, {
                        title: 'ショートカット一覧'
                    });
                    break;
            }
        }
    };
    
    var _updateDirecotryHistory = function () {
        
        var dirHistory = JSON.parse($window.localStorage.getItem('directoryHistory') || '[]');
        
        $scope.menuItems[0].items.length = 1;
        for (var i = 0, len = dirHistory.length; i < len; i++) {
            $scope.menuItems[0].items.push({label: dirHistory[i].split('\\').pop() + 'を開く', title: dirHistory[i]});
        }
    };
    
    _updateDirecotryHistory();
    
    $scope.$on('updateDirecotryHistory', function() {
        _updateDirecotryHistory();
        $scope.$apply();
    });
});
