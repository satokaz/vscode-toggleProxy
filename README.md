# vscode-toggleproxy

## Functions provided

To `enable` or `disable` the `"http.proxy":` in settings.json.

![alt](images/toggleproxy.gif)

## Installation

* Press F1 in VSCode, type `ext install` and then look for `proxy`.

## Usage

* Click the globe icon on the status bar. To toggle the setting.
* Available commands: `Proxy : Toggle`
* Or context menu: `Proxy : Toggle`
* Or Automatically switch (when Enabled)

## Automatically switch

Added a monitor to the proxy server (set to `http.proxy`) by ping (Every 10 seconds) and automatically switch `http.proxy`.

Enable automatic switching (default: false) in `settings.json`:

`"toggleproxy.autochange": true`

The setting will take effect after restarting vscode.

## tips

vscode-toggleproxy has effect only on VS Code. There is no effect on git/npmn/typings etc...
When executing with terminal, set the `http_proxy` and `https_proxy` environment variable and execute the command.

## Notes

Please make a backup of settings.json.

* **Windows**: `%APPDATA%\Code\User\settings.json` or `%APPDATA%\Roaming\Code - Insiders\User\settings.json`
* **Mac**: `$HOME/Library/Application Support/Code/User/settings.json` or `$HOME/Library/Application Support/Code - Insiders/User/settings.json`
* **Linux**: `$HOME/.config/Code/User/settings.json` or `$HOME/.config/Code - Insiders/User/settings.json`

## License

This extension is licensed under the MIT License.

<!--### For more information-->

**Enjoy!**
