import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

var statusBarItem;
var disposableCommand;
let settingsPath = getSettingsPath();
let repeat;

interface IHTTP_ProxyConf {
    http_proxyEnabled: boolean,
    http_proxyEnabledString: string,
    http_proxy: string,
    http_proxyhost: string
}

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "toggleProxy" is now active!');
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.command = 'extension.toggleProxy';
    statusBarItem.color = '#FFFFFF';

    // Autocchange disable/enable requires restart
    if (vscode.workspace.getConfiguration('toggleproxy')['autochange'] === true) {
    //
    // ping proxy 
    //
        function pingProxy() {
            var ping = require('ping');
            const httpProxy: IHTTP_ProxyConf = getHttpProxy();
            ping.sys.probe(httpProxy.http_proxyhost, function(isAlive) {
                if (isAlive) {  
                    // proxy is alive
                    console.log(httpProxy.http_proxyhost  + ' is alive.');
                    if (httpProxy.http_proxyEnabled === false) {
                        // Enable when http.proxy is disabled
                        toggleProxy(context);
                    }
                } else { 
                    // proxy is dead
                    console.log(httpProxy.http_proxyhost + ' is dead.');
                    if (httpProxy.http_proxyEnabled === true) {
                        // Disable when http.proxy is Enabled
                        toggleProxy(context);
                    }
                }
            });
            // console.log('http.proxy =', vscode.workspace.getConfiguration().get('http.proxy'));
            repeat = setTimeout(pingProxy, 10000);
        };
        pingProxy();
    } 

    statusBarUpdate();
    statusBarItem.show();
    fs.watch(settingsPath, settingsFileChanged); // statusBar will be updated any time a change happen in the file
    disposableCommand = vscode.commands.registerCommand('extension.toggleProxy', toggleProxy);
    context.subscriptions.push(disposableCommand);
}
module.exports.activate = activate;

function toggleProxy(context) {
    let settingsTmpDir = (process.platform == 'win32' ? process.env.TMP : process.env.TMPDIR);
    let settingsTmpFile = path.join(settingsTmpDir, path.basename(settingsPath + '.tmp.' + Math.random()));
    // console.log(settingsTmpDir);
    // console.log(settingsTmpFile);
    let line: string;
    let array = fs.readFileSync(settingsPath, 'utf8').toString().split("\n");
    for (line in array) {
        const matchResult = regExpMatchHttpProxy(array[line]);

        if (matchResult !== null) {
            if (!matchResult.http_proxyEnabled) {
                // should enable proxy
                array[line] = array[line].replace(/\/\/\W/, "");
                vscode.window.setStatusBarMessage('Enabled http.proxy', 2000);
            } else {
                // should disable proxy
                array[line] = array[line].replace(/^/, "// ");
                vscode.window.setStatusBarMessage('Disabled http.proxy', 2000);
            }
        }
    }
    fs.writeFileSync(settingsTmpFile, array.join('\n'), 'utf8');

    // copy tmp settings file to vscode settings
    fs.createReadStream(settingsTmpFile).pipe(fs.createWriteStream(settingsPath));
    fs.unlink(settingsTmpFile);
}

//
// Update UI when settings files is changed 
//
function settingsFileChanged(event: string, fileName: string) {
    statusBarUpdate();
}

//
// Refresh StatusBarItem 
//
function statusBarUpdate() {
    const httpProxy: IHTTP_ProxyConf = getHttpProxy();
    if (httpProxy) {
        statusBarItem.text = `$(globe)` + httpProxy.http_proxyEnabledString;
        statusBarItem.tooltip = httpProxy.http_proxy;
    }
};

//
// Check http_proxy setting
//
function getHttpProxy(): IHTTP_ProxyConf {
    let line: string;
    let array = fs.readFileSync(settingsPath, 'utf8').toString().split("\n");
    let result: IHTTP_ProxyConf = null;

    for (line in array) {
        const matchResult = regExpMatchHttpProxy(array[line]);

        if (matchResult !== null) {
            result = matchResult;
            break;
        }
    }
    return result;
}

//
// apply regExp to found the http_proxy config in settings file
// 
// matchResult[1]: // or nothing => comment
// matchResult[2]: https or http
// matchResult[3]: contains the proxy adress
function regExpMatchHttpProxy(line: string): IHTTP_ProxyConf {
    let result: IHTTP_ProxyConf = {
        http_proxy: "",
        http_proxyEnabled: false,
        http_proxyEnabledString: "",
        http_proxyhost: ""
    }
    const matchResult = line.match(/(\/\/||\s).*"(http||https).proxy".*:.*"(.*)"/);

    if (matchResult !== null) {
        // is the Proxy on?
        result.http_proxyEnabled = (matchResult[1] === "");

        // proxyEnabledString
        result.http_proxyEnabledString = result.http_proxyEnabled ? " On" : " Off"

        // http_proxy value configured
        result.http_proxy = matchResult[3];

        // Proxy hostname
        result.http_proxyhost = url.parse(matchResult[3]).hostname;
    }
    else {
        result = null;
    }
    return result;
}

//
// get the PATH of settings.json (check Stable or Insiders build?) 
//
function getSettingsPath() {
    let settingsFile;
    let settingsData;
    // var settingsData = process.env.HOME + '/Library/Application Support';
    settingsData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
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

