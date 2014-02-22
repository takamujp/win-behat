var fs = require('fs');
var path = require('path');

function ReadFileList (base_dir, recursive, callback) {

    if (!callback) {
        callback = recursive;
        recursive = null;
    }

    var pathlist = {name: base_dir, isDirectory: false, isShow: false, isOpen: !!recursive};

    if (!base_dir || !fs.existsSync(base_dir)) {
        callback(null);
        return;
    }

    if (!fs.statSync(base_dir).isDirectory()) {
        callback(pathlist);
        return;
    }

    pathlist.children = [];
    pathlist.isDirectory = true;

    fs.readdir(base_dir, function (err, filelist) {
        if (err) {
            callback(null);
            return;
        }

        var process = filelist.length;

        if (!process) {
            callback(pathlist);
            return;
        }

        for (var i = 0, len = filelist.length; i < len; i++) {
            if (recursive) {
                ReadFileList(path.join(base_dir, filelist[i]), true, function (child_pathlist) {
                    if (child_pathlist) {
                        pathlist.children.push(child_pathlist);
                    }

                    if (!--process) {
                        pathlist.children = pathlist.children.sort(SortFileList);
                        callback(pathlist);
                    }
                });
            } else {
                var child_dir = path.join(base_dir, filelist[i]);
                pathlist.children.push({name: child_dir, isDirectory: fs.statSync(child_dir).isDirectory(), isShow: false, isOpen: false});
            }
        }

        if (!recursive) {
            pathlist.children = pathlist.children.sort(SortFileList);
            callback(pathlist);
        }
    });
}

function ReadFileListSync (base_dir, recursive) {
    var pathlist = {name: base_dir, isDirectory: false, isShow: false, isOpen: !!recursive},
    filelist = null,
            child_dir = '',
            child_pathlist = null;

    if (!base_dir || !fs.existsSync(base_dir)) {
        return null;
    }

    if (!fs.statSync(base_dir).isDirectory()) {
        return pathlist;
    }

    pathlist.children = [];
    pathlist.isDirectory = true;
    filelist = fs.readdirSync(base_dir);


    for (var i = 0, len = filelist.length; i < len; i++) {
        child_dir = path.join(base_dir, filelist[i]);
        if (!!recursive) {
            child_pathlist = ReadFileListSync(child_dir);
            if (child_pathlist) {
                pathlist.children.push(child_pathlist);
            }
        } else {
            pathlist.children.push({name: child_dir, isDirectory: fs.statSync(child_dir).isDirectory(), isShow: false, isOpen: false});
        }
    }

    pathlist.children = pathlist.children.sort(SortFileList);

    return pathlist;
}

function SortFileList (a, b) {
    if ((a.isDirectory && b.isDirectory) || (!a.isDirectory && !b.isDirectory)) {
        return (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1;
    } else {
        return (a.isDirectory < b.isDirectory) ? 1 : -1;
    }
}

module.exports = {
    read: ReadFileList,
    readSync: ReadFileListSync
};