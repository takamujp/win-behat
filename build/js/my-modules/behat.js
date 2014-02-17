
var path = require('path');
var exec = exec = require('child_process').exec;
var behat = path.resolve('.', '.\\behat\\vendor\\behat\\behat\\bin\\behat').replace(/\\/g, '\\\\');
var exec_options = {
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
    if (options instanceof Array) {
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
    
    // phpにパスが通っていることを確認してから、behatを実行する
    exec('where php', exec_options, function (e) {
        if (e) {
            callback(e, '', 'php.exe not found');
            return;
        }
        
        project_dir = project_dir.replace(/([^\\])\\([^\\])/g, '$1\\\\$2');
        features = features.replace(/([^\\])\\([^\\])/g, '$1\\\\$2');
        
        // cd [path] & php behat [options] [features]
        exec('cd ' + '' + project_dir + ' & ' + 'php ' + behat + ' ' + options + ' ' + features, exec_options, function (err, stdout, stderr) {
            callback(err, stdout, stderr);
        });
    });
}

var Behat = {
    init: function (project_dir, callback) {
        RunBehat(project_dir, '--init', '', function (err, stdout, stderr) {
            callback(err, stdout, stderr);
        });
    },
    run: function (project_dir, features, callback) {
        RunBehat(project_dir, '', features, function (err, stdout, stderr) {
            callback(err, stdout, stderr);
        });
    }
};


module.exports = Behat;
