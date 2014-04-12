angular.module('winbehat').factory('behatService', function ($window, modalService) {
    
    var fs = require('fs'),
        behat = require('./js/my-modules/behat'),
        gui = require('nw.gui'),
        TMP_PATH = 'tmp/',
        PROHIBITED_CHARACTER = /[\\\/\:\*\?"<>\|]/g;
    
    
    /**
     * windowをblankで開く
     * 
     * @param {string} message 表示する内容(html5)
     */
    var _openBlankWindow = function (message) {
        var win = $window.open('', '_blank');
        $(win.document.body).html(message);
    };
    
    /**
     * behatを実行し、その結果をファイルに保存する
     * 
     * @param {string} project_dir　behatを実行するディレクトリ
     * @param {string} features 実行対象のfeatureファイルのパス・featureファイルのディレクトリのパス
     */
    behat.saveHtmlResults = function (project_dir, features, callback) {
        behat.run(project_dir, '-f html', features, function (err, stdout, stderr) {
            var filename = '';
            
            if (err && !stdout) {
                err.message = stderr || err.message;
                callback (err);
                return;
            }
            
            filename = TMP_PATH + (project_dir + features + '.html').replace(PROHIBITED_CHARACTER, '');
            
            fs.open('build/' + filename, 'w', '0777', function (err, fd) {
                if (err) {
                    fs.unlink('build/' + filename, function (err) {});
                    callback(err);
                    return;
                }
                
                fs.write(fd, new Buffer(stdout), 0, Buffer.byteLength(stdout), function (err) {
                    
                    fs.close(fd);
                    if (err) {
                        fs.unlink('build/' + filename, function (err) {});
                        callback(err);
                        return;
                    }
                    
                    callback(null, filename);
                });
            });
            
        });
    };
    
    /**
     * behatを実行し、その結果を別ウィンドウに表示する
     * 
     * @param {string} project_dir　behatを実行するディレクトリ
     * @param {string} features 実行対象のfeatureファイルのパス・featureファイルのディレクトリのパス
     */
    behat.showHtmlResults = function (project_dir, features) {
        behat.saveHtmlResults(project_dir, features, function (err, filepath) {
            if (err) {
                modalService.openModal('template/modal/error.html', true, {
                    title: 'behat実行エラー',
                    message: err.message
                });
                return;
            }
            
            var query = '?params=' + encodeURIComponent(JSON.stringify({project:project_dir, features:features, filepath:filepath})),
                win = gui.Window.get($window.open('result-window.html' + query));

            win.on('closed', function () {
                win = null;
                fs.unlink('build/' + filepath, function (err) {});
            });
            
            gui.Window.get().on('closed', function () {
                if (win) {
                    fs.unlink('build/' + filepath, function (err) {
                        win.close();
                    });
                }
            });
        });
    };
    
    /**
     * 未定義のスニペットを別ウィンドウに表示する
     * 
     * @param {string} project_dir　behatを実行するディレクトリ
     * @param {string} features 実行対象のfeatureファイルのパス・featureファイルのディレクトリのパス
     */
    behat.showSnippets = function (project_dir, features) {
        behat.run(project_dir, '-f snippets', features, function (err, stdout, stderr) {
            if (err && !stdout) {
                modalService.openModal('template/modal/error.html', true, {
                    title: 'behat実行エラー',
                    message: stderr || err.message
                });
                return;
            }
            
            if (stdout.replace(/[\n|\r]/g, '')) {
                _openBlankWindow('<pre>' + stdout + '</pre>');
            } else {
                modalService.openModal('template/modal/error.html', true, {
                    title: 'ステップ表示エラー',
                    message: '未定義のステップはありませんでした'
                });
            }
        });
    };
    
    return behat;
});


