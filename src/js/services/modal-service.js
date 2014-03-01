

angular.module('winbehat').factory('modalService', function ($modal) {
    
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
                    $modalInstance.close({selected: 'ok', params: params});
                };
                
                $scope.no = params.no || function () {
                    $modalInstance.close({selected: 'no', params: params});
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

    return {
        openModal: openModal
    };
});