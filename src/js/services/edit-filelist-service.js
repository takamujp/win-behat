
angular.module('winbehat').factory('editFilelistService', function () {    
    var fs = require('fs'),
        path = require('path'),
        ext_list = require('./js/my-modules/filename-extension-list'),
        list = [];
    
    var push = function (file_path) {
        
        var notExist = true,
            text = '',
            i = 0,
            len = list.length;
        
        for (; i < len; i++) {
            if (list[i].path === file_path) {
                notExist = false;
                break;
            }
        }

        if (notExist) {
            text = fs.readFileSync(file_path).toString();
            list.push({
                path: file_path,
                name: file_path.split('\\').pop(),
                isSelected: false,
                text: text,
                lastText: '',
                history: null,
                mode: ext_list[path.extname(file_path).split('.').pop()],
                save: function (callback) {
                    if (this.text == null) {
                        callback && callback(new Error('text undefined'));
                        return;
                    }
                    
                    fs.writeFile(this.path, this.text, function (err) {
                        if (err && callback) {
                            callback(err);
                            return;
                        }
                        
                        this.lastText = this.text;
                        callback && callback();
                    }.bind(this));
                },
                isChanged: function () {
                    return this.text != this.lastText;
                }
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


