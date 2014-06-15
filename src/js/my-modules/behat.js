
var path = require('path');
var exec = require('child_process').exec;
var BEHAT_PATH = path.resolve('.', '.\\behat\\vendor\\behat\\behat\\bin\\behat').replace(/\\/g, '\\\\');
var EXEC_OPTIONS = {
    encoding: 'utf8',
    maxBuffer: 20000*1024
};

/**
 * Behatを実行する
 * 
 * @param {string} project_dir behatを実行するディレクトリ
 * @param {Array|object|string} options behatコマンドのオプション
 * @param {string} features 実行するfeaatureファイルまたはディレクトリ
 * @param {function} callback コールバック
 */
function RunBehat(project_dir, options, features, callback) {    
    exec('where php', EXEC_OPTIONS, function (e) {
        if (e) {
            callback(e, '', 'php.exe not found');
            return;
        }
        
        exec('where behat', EXEC_OPTIONS, function (e) {
            var behat = 'behat';
            if (e) {
                behat = 'php ' + BEHAT_PATH;
            }
            
            (RunBehat = function RunBehat(project_dir, options, features, callback) {
                if (options.join) {
                    options = options.join(' ');
                } else if (typeof options == 'object') {
                    var tmp = '';
                    for (var key in options) {
                        tmp += ' ' + key + ' ' + options[key];
                    }
                    options = tmp;
                } else if (typeof options !== 'string') {
                    options = '';
                }

                project_dir = project_dir.replace(/([^\\])\\([^\\])/g, '$1\\\\$2');
                features = features.replace(/([^\\])\\([^\\])/g, '$1\\\\$2');

                // cd [path] & php behat [options] [features]
                exec('cd ' + '' + project_dir + ' & ' + behat + ' ' + options + ' ' + features, EXEC_OPTIONS, function (err, stdout, stderr) {
                    callback(err, stdout, stderr);
                });
            })(project_dir, options, features, callback);
        });
    });
}

var Behat = {
    init: function (project_dir, callback) {
        RunBehat(project_dir, '--init', '', function (err, stdout, stderr) {
            callback(err, stdout, stderr);
        });
    },
    run: function (project_dir, options, features, callback) {
        RunBehat(project_dir, options, features, function (err, stdout, stderr) {
            callback(err, stdout, stderr);
        });
    }
};


module.exports = Behat;
