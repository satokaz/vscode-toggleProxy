
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
    // StatusBar にアイコンとステータスを表示する
    // function activate() の中に書くと、Status Bar に出力される 
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
        var settingsTmpFile = process.env.TMPDIR + path.basename(settingsPath + '.' + process.env.USER + '.tmp.' + Math.random());
        var i;
        var count = 0;
        var array = fs.readFileSync(settingsPath, 'utf8').toString().split("\n");
        for (i in array) {
            if (array[i].match(/\/\/\W/) && array[i].match(/.*"http(s)?.proxy".*/)) {
                array[i] = array[i].replace(/\/\/\W/, "");
                vscode.window.setStatusBarMessage('enabled the http_proxy', 2000);
                statusBarItem.text = (`$(globe) on`);
                count++;
                vscode.Disposable.from(disposableProvider).dispose();
            } else if (array[i].match(/.*"http(s)?.proxy".*/)) {
                array[i] = array[i].replace(/^/, "// ");
                vscode.window.setStatusBarMessage('disabled the http_proxy', 2000);
                statusBarItem.text = (`$(globe) off`);
                vscode.Disposable.from(disposableProvider).dispose();
            }
            // console.log(array[i]);
        }
        console.log(array.toString);
        fs.writeFileSync(settingsTmpFile, array.join('\n'), 'utf8');
        fs.createReadStream(settingsTmpFile).pipe(fs.createWriteStream(settingsPath));
        fs.unlink(settingsTmpFile);
        console.log("count:", count);
    });
    context.subscriptions.push(disposableCommand);
}
module.exports.activate = activate;

//
// Check http_proxy setting
//
function getHttpProxy() {
    var i;
    var array = fs.readFileSync(settingsPath, 'utf8').toString().split("\n");
    for (i in array) {
        if (array[i].match(/\/\/\W/) && array[i].match(/.*"http(s)?.proxy".*/)) {
            console.log("getHttpProxy: http_proxy が無効みたい: ", array[i]);
            isProxyEnabled = ' off';
        } else if (array[i].match(/.*"http(s)?.proxy".*/)) {
            console.log("getHttpProxy: http_proxy が有効みたい: ", array[i]);
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
    // var settingsData = process.env.HOME + '/Library/Application Support';
    let settingsData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
    
    if ((process.execPath).match(/Insiders/)) {
        settingsFile = path.join(settingsData, "Code - Insiders/User/settings.json");
    } else {
        settingsFile = path.join(settingsData, "Code/User/settings.json");
    }
    return settingsFile;
}

    // let projectFile: string;
    // let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
    // projectFile = path.join(appdata, "Code/User/projects.json");
    
    // // in linux, it may not work with /var/local, then try to use /home/myuser/.config
    // if ((process.platform == 'linux') && (!fs.existsSync(projectFile))) {
    //     let os = require('os');
    //     projectFile = path.join(os.homedir(), '.config/Code/User/projects.json');
    // }