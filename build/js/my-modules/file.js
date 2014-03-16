var fs = require('fs');
var path = require('path');
var PROHIBITED_CHARACTER =  /[\\\/\:\*\?"<>\|]/g;


function File (name, parent) {
    this.name = name;
    this.parent = parent;
    this.children = [];
    this.isShow = false;
    this.isOpen = false;
    
    if (this.parent) {
        this.parent.children.push(this);
    }
}

/**
 * パスを取得する
 */
File.prototype.path = function () {
    if (this.parent) {
        return path.join(this.parent.path(), this.name);
    } else {
        return this.name;
    }
};

/**
 * ディレクトリかどうか判定する
 */
File.prototype.isDirectory = function () {
    return fs.statSync(this.path()).isDirectory();
};

/**
 * ファイルを削除する
 * 
 * @param function callback(err, file)
 */
File.prototype.delete = function (callback) {
    if (this.isDirectory()) {
        callback(new Error('ディレクトリは削除できません'));
        return;
    }
    
    if (!fs.existsSync(this.path())) {
        callback(new Error('すでに削除されています'));
        return;
    }
    
    fs.unlink(this.path(), function (err) {
        if (err) {
            callback(err);
        }
        
        for (var i = 0, len = this.parent.children.length; i < len; i++ ) {
            if (this.parent.children[i].name == this.name) {
                callback(null, this.parent.children.splice(i, 1));
                break;
            }
        }
        
    }.bind(this));
};

/**
 * ファイルに書き込む
 * 
 * @param string text
 * @param function callback(err)
 */
File.prototype.write = function (text, callback) {
    if (fs.existsSync(this.path()) && this.isDirectory()) {
        callback(new Error('ファイルではありません'));
        return;
    }
    
    fs.open(this.path(), 'w', '0777', function (err, fd) {
        if (err) {
            callback(err);
            return;
        }

        // 改行なしの日本語を保存すると文字化けするので、1行以下の場合改行させる
        if (text.split("\n").length <= 1) {
            text += "\n";
        }

        fs.write(fd, new Buffer(text), 0, Buffer.byteLength(text), function (err) {
            fs.close(fd);
            callback(err);
        }.bind(this));
    }.bind(this));
};

/**
 * ファイルを読み込む
 * 
 * @return string
 */
File.prototype.readSync = function () {
    var path = this.path();
    
    if (!fs.existsSync(this.path())) {
        return new Error('file not found.');
    }

    return fs.readFileSync(path, {encoding: 'utf8'});
};

/**
 * ファイル名変更
 * 
 * @param {string} name
 * @param {callback} callback(err)
 */
File.prototype.rename = function (name, callback) {
    var oldPath = this.path(),
        oldName = this.name;

    if (this.isDirectory()) {
        callback(new Error('ファイルではありません'));
        return;
    }

    if (PROHIBITED_CHARACTER.test(name)) {
        callback('ファイル名に \/:*?"<>| は使用できません');
        return;
    }
    
    this.name = name;

    if (fs.existsSync(this.path())) {
        this.name = oldName;
        callback('すでに存在するファイル名です');
        return;
    }

    fs.rename(oldPath, this.path(), function (err) {
        if (err) {
            this.name = oldName;
        }
        
        callback(err);
    });
};

/**
 * 新規ファイルを作成する
 * 
 * @param {string} name
 * @param {string} text
 * @param {function} callback(err)
 */
File.prototype.createChildFile = function (name, text, callback) {
    if (!this.isDirectory()) {
        callback(new Error('ディレクトリではありません'));
        return;
    }
    
    if (PROHIBITED_CHARACTER.test(name)) {
        callback(new Error('ファイル名に \/:*?"<>| は使用できません'));
        return;
    }
    
    if (fs.existsSync(path.join(this.path(), name))) {
        callback(new Error('すでに存在するファイル名です'));
        return;
    }
    
    var newFile = new File(name, this);
    newFile.write(text || '', callback);
};

/**
 * 新規ディレクトリを追加する
 * 
 * @param {string} name
 * @param {function} callback(err)
 */
File.prototype.createChildDirectory = function (name, callback) {
    if (!this.isDirectory()) {
        callback(new Error('ディレクトリではありません'));
        return;
    }
    
    if (PROHIBITED_CHARACTER.test(name)) {
        callback(new Error('ディレクトリ名に \/:*?"<>| は使用できません'));
        return;
    }
    
    
    var dirPath = path.join(this.path(), name);
    
    fs.mkdir(dirPath, function (err) {
        if (err) {
            callback(err.code == 'EEXIST' ? new Error('すでに同名のディレクトリが存在します') : err.message);
            return;
        }

        new File(name, this);
        callback();
    }.bind(this));
};

module.exports = File;