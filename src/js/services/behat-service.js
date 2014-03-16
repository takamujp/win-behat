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
     * behatを実行し、その結果を別ウィンドウに表示する
     * 
     * @param {string} project_dir　behatを実行するディレクトリ
     * @param {string} features 実行対象のfeatureファイルのパス・featureファイルのディレクトリのパス
     */
    behat.showHtmlResults = function (project_dir, features) {
        behat.run(project_dir, '-f html', features, function (err, stdout, stderr) {
            var filename = '';
            
            if (err) {
                if (stdout) {
                    if (stdout.indexOf('<!DOCTYPE html')) {
                        _openBlankWindow('<pre>' + stdout + '</pre>');
                        return;
                    }
                } else {
                    modalService.openModal('template/modal/error.html', true, {
                        title: 'behat実行エラー',
                        message: stderr || err.message
                    });
                    return;
                }
            }
            
            filename = TMP_PATH + (project_dir + features + '.html').replace(PROHIBITED_CHARACTER, '');
            
            var faildCreateFile = function () {
                fs.unlink('build/' + filename, function (err) {});
                _openBlankWindow(stdout);
            };
            
            fs.open('build/' + filename, 'w', '0777', function (err, fd) {
                if (err) {
                    faildCreateFile();
                    return;
                }
                
                fs.write(fd, new Buffer(stdout), 0, Buffer.byteLength(stdout), function (err) {
                    var win = null;
                    
                    fs.close(fd);
                    if (err) {
                        faildCreateFile();
                        return;
                    }
                    
                    win = gui.Window.get(
                        $window.open(filename)
                    );
                    
                     win.on('closed', function() {
                         win = null;
                         fs.unlink('build/' + filename, function (err) {});
                     });
                });
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


