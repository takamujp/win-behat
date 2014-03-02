
angular.module('winbehat').controller('menuController', function ($scope, $rootScope) {
    var CATEGORY = {
        FILE: 'ファイル'
    };
    
    var ACTION = {
        OPEN_PROJECT: 'プロジェクトを開く'
    };
    
    $scope.menuItems = [
        {
            label: CATEGORY.FILE,
            items: [
                {label: ACTION.OPEN_PROJECT}
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
    };
});
