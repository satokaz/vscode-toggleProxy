import * as vscode from 'vscode';
import * as path from 'path';

export function saveProject() {
    // Display a message box to the user
    var httpProxy;

    // ask the PROJECT NAME (suggest the )
    var ibo = <vscode.InputBoxOptions>{
        prompt: "Proxy Server",
        placeHolder: "http://example:80",
        value: httpProxy
    }

    // vscode.window.showInputBox(ibo).then(proxyName => {
    //     if (typeof proxyName == 'undefined') {
    //         return;
    //     }

    //     // 'empty'
    //     if (proxyName == '') {
    //         vscode.window.showWarningMessage('You must define a name for the Proxy server.');
    //         return;
    //     }

    //     // var rootPath = compactHomePath(vscode.workspace.rootPath);

    //     var items = []
    //     if (getProxyListPath()) {
    //         items = loadProjects(getProjectFilePath());
    //         if (items == null) {
    //             return;
    //         }
    //     }

    //     var found: boolean = false;
    //     for (var i = 0; i < items.length; i++) {
    //         var element = items[i];
    //         if (element.label == proxyName) {
    //             found = true;
    //         }
    //     }

    //     if (!found) {
    //         aStack.push(proxyName);
    //         context.globalState.update('recent', aStack.toString());
    //         items.push({ label: proxyName, description: rootPath });
    //         fs.writeFileSync(getProjectFilePath(), JSON.stringify(items, null, "\t"));
    //         vscode.window.showInformationMessage('Project saved!');
    //         showStatusBar(proxyName);
    //     } else {
    //         var optionUpdate = <vscode.MessageItem>{
    //             title: "Update"
    //         };
    //         var optionCancel = <vscode.MessageItem>{
    //             title: "Cancel"
    //         };

    //         vscode.window.showInformationMessage('Project already exists!', optionUpdate, optionCancel).then(option => {
    //             // nothing selected
    //             if (typeof option == 'undefined') {
    //                 return;
    //             }

    //             if (option.title == "Update") {
    //                 for (var i = 0; i < items.length; i++) {
    //                     if (items[i].label == proxyName) {
    //                         items[i].description = rootPath;
    //                         aStack.push(proxyName);
    //                         context.globalState.update('recent', aStack.toString());
    //                         fs.writeFileSync(getProjectFilePath(), JSON.stringify(items, null, "\t"));
    //                         vscode.window.showInformationMessage('Project saved!');
    //                         showStatusBar(proxyName);
    //                         return;
    //                     }
    //                 }
    //             } else {
    //                 return;
    //             }
    //         });
    //     }
    // });
};