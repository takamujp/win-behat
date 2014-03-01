
angular.module('winbehat').factory('editFilelistService', function () {    
    var fs = require('fs'),
        list = [];
    
    var push = function (path) {
        
        var notExist = true,
            text = '',
            i = 0,
            len = list.length;
        
        for (; i < len; i++) {
            if (list[i].path === path) {
                notExist = false;
                break;
            }
        }

        if (notExist) {
            text = fs.readFileSync(path).toString();
            list.push({
                path: path,
                name: path.split('\\').pop(),
                isSelected: false,
                text: text,
                lastText: '',
                history: null
            });
        }
    };
    
    var remove = function (id) {
        return list.splice(id, 1)[0];
    };
    
    var select = function (id) {
        var i = 0,
            len = list.length;
        
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
    
    return {
        list: list,
        push: push,
        remove: remove,
        select: select
    };
});


