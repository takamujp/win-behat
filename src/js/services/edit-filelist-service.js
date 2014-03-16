
angular.module('winbehat').factory('editFilelistService', function () {    
    var fs = require('fs'),
        path = require('path'),
        extList = require('./js/my-modules/filename-extension-list'),
        list = [];
    
    var push = function (file) {
        
        var filePath = file.path(),
            text = '',
            i = 0,
            len = list.length;
        
        for (; i < len; i++) {
            if (list[i].file.path() === filePath) {
                return i;
                break;
            }
        }

        if (!fs.existsSync(filePath)) {
            return new Error(filePath + ' not found.');
        }

        text = file.readSync();
        list.push({
            file: file,
            isSelected: false,
            text: text,
            lastText: '',
            history: null,
            mode: extList[path.extname(filePath).split('.').pop()],
            save: function (callback) {
                file.write(this.text, function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    this.lastText = this.text;
                    callback();
                }.bind(this));
            },
            isChanged: function () {
                return this.text != this.lastText;
            }
        });
        
        return true;
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
    
    var rename = function (id, path) {
        list[id].path = path;
        list[id].name = path.split('\\').pop();
    };
    
    var getId = function (filePath) {
        var i = 0,
            len = 0;
    
        for (i = 0, len = list.length; i < len; i++) {
            if (list[i].file.path() == filePath) {
                return i;
            }
        }
        
        return -1;
    };
        
    return {
        list: list,
        push: push,
        remove: remove,
        select: select,
        rename: rename,
        getId: getId
    };
});


