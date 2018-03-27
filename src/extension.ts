import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';
import * as os from 'os';
import * as httpRequest from 'request-light';
import * as ping from 'ping';

const notifier = require('node-notifier');

var statusBarItem;
var disposableCommand;
let settingsPath = getSettingsPath();

interface IHTTP_ProxyConf {
    http_proxyEnabled: boolean,
    http_proxyEnabledString: string,
    http_proxy: string,
    http_port: string,
    http_proxyhost: string
}

const config = vscode.workspace.getConfiguration('toggleproxy');
// console.log(config.inspect<string>('autochange'));
// console.log(config.inspect<string>('notifier'));
// console.log(vscode.workspace.getConfiguration('http').inspect<string>('proxy'));

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "toggleProxy" is now active!');

    console.log(os.tmpdir());

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.text = `$(globe)` + "undefined";
    statusBarItem.command = 'extension.toggleProxy';
    statusBarItem.color = '#FFFFFF';

	// vscode.workspace.onDidChangeConfiguration(e => configureHttpRequest());
    // // Autocchange disable/enable requires restart
    // if (vscode.workspace.getConfiguration('toggleproxy')['autochange'] === true) {
    //     pingProxy();
    // }

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
        configureHttpRequest();
        if (vscode.workspace.getConfiguration('toggleproxy')['autochange'] === true) {
            pingProxy();
        }
    }));

    statusBarUpdate();
    statusBarItem.show();
    fs.watch(settingsPath, settingsFileChanged); // statusBar will be updated any time a change happen in the file
    disposableCommand = vscode.commands.registerCommand('extension.toggleProxy', toggleProxy);
    context.subscriptions.push(disposableCommand);
}
module.exports.activate = activate;

async function toggleProxy() {

    const httpProxy: IHTTP_ProxyConf = getHttpProxy();

    // let settingsTmpDir = (process.platform == 'win32' ? process.env.TMP : process.env.TMPDIR);
    let settingsTmpDir = os.tmpdir();
    let settingsTmpFile = path.join(settingsTmpDir, path.basename(settingsPath + '.tmp.' + Math.random()));

    // debug
    // console.log(settingsTmpDir);
    // console.log(settingsTmpFile);

    let line: string;
    let array = await fs.readFileSync(settingsPath, 'utf8').toString().split("\n");

    // Backup to extensionPath
    let backupTmpFile = path.join(vscode.extensions.getExtension("satokaz.vscode-toggleproxy").extensionPath, path.basename(settingsPath + '.tmp'));
    if(fs.statSync(settingsPath).size !== 0){
        await fs.writeFileSync(backupTmpFile, array.join('\n'));
    }

    for (line in array) {
        const matchResult = regExpMatchHttpProxy(array[line]);

        // console.log('matchResult =', matchResult)

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

    await fs.writeFileSync(settingsTmpFile, array.join('\n'));
    // copy tmp settings file to vscode settings
    // console.log("fs.writeFileSync(settingsPath, fs.readFileSync(settingsTmpFile,\"utf-8\"), 'utf8');")
    await fs.writeFileSync(settingsPath, await fs.readFileSync(settingsTmpFile,"utf-8"));
    // console.log("fs.unlink(settingsTmpFile);");
    await fs.unlink(settingsTmpFile);

    // node-notifier
    if (vscode.workspace.getConfiguration('toggleproxy')['notifier'] === true) {
            notifier.notify({
            'title': 'Visual Studio Code - Proxy Notification',
            'message': !httpProxy.http_proxyEnabled ? 'Proxy Enabled: ' + httpProxy.http_proxy : 'Proxy Disabled',
            'appName': 'Visual Studio Code',
            'icon': path.join(vscode.extensions.getExtension("satokaz.vscode-toggleproxy").extensionPath, path.join('images', 'octicon-globe_128_0_7c05c9_none.png')) ,
            timeout: 5
        });
    }
    vscode.workspace.onDidChangeConfiguration(e => configureHttpRequest());
    return void 0;
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
        http_port: "",
        http_proxyEnabled: false,
        http_proxyEnabledString: "",
        http_proxyhost: ""
    }
    // console.log("line = ", line)
    const matchResult = line.match(/([\/\/]||[^\s.*\/\/]).*"(http||https).proxy".*:.*"(.*)"/);
    // console.log('matchResult in regExpMatchHttpProxy =', matchResult);

    if (matchResult !== null) {
        // is the Proxy on?
        result.http_proxyEnabled = (!matchResult[0].match(/^.*?(\/\/).*"(http||https).proxy"/)) ? true : false;
        // console.log('result.http_proxyEnabled =', result.http_proxyEnabled);

        // proxyEnabledString
        result.http_proxyEnabledString = result.http_proxyEnabled ? " On" : " Off"

        // http_proxy value configured
        result.http_proxy = matchResult[3];

        // proxy port
        result.http_port = url.parse(matchResult[3]).port;

        // Proxy hostname
        result.http_proxyhost = url.parse(matchResult[3]).hostname;
    }
    else {
        result = null;
    }
    // console.log(result);
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
    // console.log("settingsFile =", settingsFile);

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

//
// ping proxy
//
function pingProxy() {
    const config = vscode.workspace.getConfiguration('toggleproxy');
    let values = (config.get('pingInterval') === undefined) ? Number(30000) : +config.get('pingInterval');
    // console.log('values =', values);

    const httpProxy: IHTTP_ProxyConf = getHttpProxy();
    ping.sys.probe(httpProxy.http_proxyhost, function(isAlive) {
        if (isAlive) {
            // proxy is alive
            // console.log(httpProxy.http_proxyhost  + ' is alive.');
            if (httpProxy.http_proxyEnabled === false) {
                // Enable when http.proxy is disabled
                toggleProxy();
            }
        } else {
            // proxy is dead
            // console.log(httpProxy.http_proxyhost + ' is dead.');
            if (httpProxy.http_proxyEnabled === true) {
                // Disable when http.proxy is Enabled
                toggleProxy();
            }
        }
    });
    // console.log('http.proxy =', vscode.workspace.getConfiguration().get('http.proxy'));
    setTimeout(pingProxy, values);
};

function configureHttpRequest() {
	let httpSettings = vscode.workspace.getConfiguration('http');
	httpRequest.configure(httpSettings.get<string>('proxy'), httpSettings.get<boolean>('proxyStrictSSL'));
}