
angular.module('winbehat').factory('editFilelistService', function () {    
    var fs = require('fs'),
        path = require('path'),
        extList = require('./js/my-modules/filename-extension-list'),
        list = [];
    
    var push = function (file_path) {
        
        var text = '',
            i = 0,
            len = list.length;
        
        for (; i < len; i++) {
            if (list[i].path === file_path) {
                return i;
                break;
            }
        }

        if (!fs.existsSync(file_path)) {
            return new Error(file_path + ' not found.');
        }

        text = fs.readFileSync(file_path, {encoding: 'utf8'});
        list.push({
            path: file_path,
            name: file_path.split('\\').pop(),
            isSelected: false,
            text: text,
            lastText: '',
            history: null,
            mode: extList[path.extname(file_path).split('.').pop()],
            save: function (callback) {
                if (this.text == null) {
                    callback && callback(new Error('text undefined'));
                    return;
                }

                fs.open(this.path, 'w', '0777', function (err, fd) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    // 改行なしの日本語を保存すると文字化けするので、1行以下の場合改行させる
                    var text = this.text;
                    if (text.split("\n").length <= 1) {
                        text += "\n";
                    }

                    fs.write(fd, new Buffer(text), 0, Buffer.byteLength(text), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        fs.close(fd);
                        this.lastText = this.text;
                        callback();
                    }.bind(this));
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
    
    var getId = function (file_path) {
        var i = 0,
            len = 0;
    
        for (i = 0, len = list.length; i < len; i++) {
            if (list[i].path == file_path) {
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


