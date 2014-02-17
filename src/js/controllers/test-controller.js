
angular.module('winbehat').controller('testController', function ($scope, behatService) {
    $scope.initTarget = 'init';
    $scope.runTarget = 'run';
    $scope.result = 'ret';

    $scope.initBehat = function () {
        behatService.init($scope.initTarget, function (err, stdout, stderr) {
            $scope.$apply(function () {
                $scope.result = err + ' ' + stdout;
            });
        });
    };

    $scope.runBehat = function () {
        behatService.run($scope.runTarget, '.', function (err, stdout, stderr) {
            $scope.$apply(function () {
                $scope.result = err + ' ' + stdout;
            });
        });
    };
});
