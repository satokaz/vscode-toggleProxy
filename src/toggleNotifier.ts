import * as vscode from 'vscode';
import * as path from 'path';
const notifier = require('node-notifier'); 

export default function toggleNotifier(httpProxy) {
    // console.log('http_proxyEnabled in toggleNotifier() =', httpProxy.http_proxyEnabled );

    notifier.notify({
        'title': 'Visual Studio Code - Proxy Notification',
        'message': httpProxy.http_proxyEnabled ? 'Proxy Enabled: ' + httpProxy.http_proxy : 'Proxy Disabled',
        'message2': 'test',
        'icon': path.join(vscode.extensions.getExtension("satokaz.vscode-toggleproxy").extensionPath, path.join('images', 'octicon-globe_128_0_7c05c9_none.png')) ,
        timeout: 5
    });
}