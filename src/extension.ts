import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

var statusBarItem;
var isProxyEnabled;
var disposableProvider;
let settingsPath = getSettingsPath();

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "toggleProxy" is now active!');
    var statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.tooltip = 'http_proxy: ' + isProxyEnabled;
    statusBarItem.command = 'extension.toggleProxy';
    statusBarItem.color = '#FFFFFF';
    //
    // Workaround in order to refresh the all-window StatusBarItem.text? 
    //
    function statusBarUpdate() {
        statusBarItem.text = `$(globe)` + getHttpProxy();
        setTimeout(statusBarUpdate, 10000);
    };
    statusBarUpdate();
    statusBarItem.show();

    let disposableCommand = vscode.commands.registerCommand('extension.toggleProxy', (context) => {
        var settingsTmpDir = (process.platform == 'win32' ? process.env.TMP: process.env.TMPDIR);
        var settingsTmpFile = path.join(settingsTmpDir, path.basename(settingsPath + '.tmp.' + Math.random()));
        // console.log(settingsTmpDir);
        // console.log(settingsTmpFile);
        var i;
        var count = 0;
        var array = fs.readFileSync(settingsPath, 'utf8').toString().split("\n");
        for (i in array) {
            if (array[i].match(/\/\/\W/) && array[i].match(/.*"http(s)?.proxy".*/)) {
                array[i] = array[i].replace(/\/\/\W/, "");
                vscode.window.setStatusBarMessage('Enabled http.proxy', 2000);
                statusBarItem.text = (`$(globe) on`);
                count++;
                vscode.Disposable.from(disposableProvider).dispose();
            } else if (array[i].match(/.*"http(s)?.proxy".*/)) {
                array[i] = array[i].replace(/^/, "// ");
                vscode.window.setStatusBarMessage('Disabled http.proxy', 2000);
                statusBarItem.text = (`$(globe) off`);
                vscode.Disposable.from(disposableProvider).dispose();
            }
        }
        fs.writeFileSync(settingsTmpFile, array.join('\n'), 'utf8');
        fs.createReadStream(settingsTmpFile).pipe(fs.createWriteStream(settingsPath));
        fs.unlink(settingsTmpFile);
    });
    context.subscriptions.push(disposableCommand);
}
module.exports.activate = activate;

//
// Check http_proxy setting
//
function getHttpProxy() {
    var j;
    var array = fs.readFileSync(settingsPath, 'utf8').toString().split("\n");
    for (j in array) {
        if (array[j].match(/\/\/\W/) && array[j].match(/.*"http(s)?.proxy".*/)) {
            // console.log("getHttpProxy: disabled the http.proxy: ", array[j]);
            isProxyEnabled = ' off';
        } else if (array[j].match(/.*"http(s)?.proxy".*/)) {
            // console.log("getHttpProxy: enabled the http.proxy: ", array[j]);
            isProxyEnabled = ' on';
        }
    }
    return isProxyEnabled;
}

//
// get the PATH of settings.json (check Stable or Insiders build?) 
//
function getSettingsPath() {
    let settingsFile;
    let settingsData;
    // var settingsData = process.env.HOME + '/Library/Application Support';
    settingsData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support': '/var/local' );
    if ((process.execPath).match(/insiders/ig)) {
        settingsFile = path.join(settingsData, "Code\ -\ Insiders/User/settings.json");
    } else {
        settingsFile = path.join(settingsData, "Code/User/settings.json");
    }

    // Workaround for Linux
    if (process.platform == 'linux') {
        let os = require('os');
        settingsData = path.join(os.homedir(), '.config/');
        if ((process.execPath).match(/insiders/ig)) {
            settingsFile = path.join(settingsData, "Code\ -\ Insiders/User/settings.json");
        } else {
            settingsFile = path.join(settingsData, "Code/User/settings.json");
        } 
    }
    return settingsFile;
}