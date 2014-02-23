
angular.module('winbehat').factory('editFilelistService', function () {
    
    var list = [];
    
    var push = function (path) {
        
        var notExist = true;
        
        angular.forEach(list, function (file) {
            if (file.path === path) {
                file.isSelected = true;
                notExist = false;
            } else {
                file.isSelected = false;
            }
        });
        if (notExist) {
            list.push({
                path: path,
                name: path.split('\\').pop(),
                isSelected: true,
                lastText: ''
            });
        }
    };
    
    var select = function (editFile) {
        angular.forEach(list, function (file) {
            file.isSelected = false;
        });
        
        if (editFile) {
            editFile.isSelected = true;
        }
    };
    
    return {
        list: list,
        push: push,
        select: select
    };
});


