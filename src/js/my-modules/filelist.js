var fs = require('fs');
var path = require('path');
var file = require('./file');

//function File (path) {
//    return {name: path, isDirectory: false, isShow: false, isOpen: false};
//}

function ReadFileList (name, parent, recursive, callback) {

    if (!callback) {
        callback = recursive;
        recursive = null;
    }

    var baseFile = new file(name, parent),
        checkPath = name;
    baseFile.isOpen = !!recursive;
    baseFile.isShow = !!recursive;
    
    if (parent) {
        checkPath = path.join(parent.path(), name);
    }

    if (!checkPath || !fs.existsSync(checkPath)) {
        callback(null);
        return;
    }

    if (!fs.statSync(checkPath).isDirectory()) {
        callback(baseFile);
        return;
    }

    baseFile.children = [];

    fs.readdir(checkPath, function (err, filelist) {
        if (err) {
            callback(null);
            return;
        }

        var process = filelist.length;

        if (!process) {
            callback(baseFile);
            return;
        }

        for (var i = 0, len = filelist.length; i < len; i++) {
            if (recursive) {
                ReadFileList(filelist[i], baseFile, true, function () {
                    if (!--process) {
                        baseFile.children = baseFile.children.sort(SortFileList);
                        callback(baseFile);
                    }
                });
            } else {
                new file(filelist[i], baseFile);
            }
        }

        if (!recursive) {
            baseFile.children = baseFile.children.sort(SortFileList);
            callback(baseFile);
        }
    });
}

function SortFileList (a, b) {
    if ((a.isDirectory() && b.isDirectory()) || (!a.isDirectory() && !b.isDirectory())) {
        return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
    } else {
        return (a.isDirectory() < b.isDirectory()) ? 1 : -1;
    }
}

module.exports = {
    read: ReadFileList,
    sortFunc: SortFileList
};
