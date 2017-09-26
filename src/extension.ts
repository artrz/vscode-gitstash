'use strict';

import './init';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import GitStashTreeDataProvider from './GitStashTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
    const gitStashTreeDataProvider = new GitStashTreeDataProvider();

    vscode.window.registerTreeDataProvider('gitstash.explorer', gitStashTreeDataProvider);

    const stashCommand = vscode.commands.registerCommand('gitstash.show', (model, node) => {
        model.getStashedFile(node).then(result => {
            const baseFile = getFile(node.name, result.base);
            const modifiedFile = getFile(node.name, result.modified);

            vscode.commands.executeCommand<void>(
                'vscode.diff',
                vscode.Uri.file(baseFile.name),
                vscode.Uri.file(modifiedFile.name),
                gitStashTreeDataProvider.getDiffTitle(node),
                { preview: true }
            );
        });
    });

    const watcher = vscode.workspace.createFileSystemWatcher('**/refs/stash', false, false, false);

    const createWatcher = watcher.onDidCreate((event) => {
        gitStashTreeDataProvider.reload('c', event);
    });
    const updateWatcher = watcher.onDidChange((event) => {
        gitStashTreeDataProvider.reload('u', event);
    });
    const deleteWatcher = watcher.onDidDelete((event) => {
        gitStashTreeDataProvider.reload('d', event);
    });
    const settingsWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
        gitStashTreeDataProvider.reload('s');
    });

    context.subscriptions.push(stashCommand);
    context.subscriptions.push(createWatcher);
    context.subscriptions.push(updateWatcher);
    context.subscriptions.push(deleteWatcher);
    context.subscriptions.push(settingsWatcher);
}

function getFile(filename: string, content: string): any {
    const file = tmp.fileSync({ postfix: path.extname(filename) });
    fs.writeFileSync(file.name, content);

    return file;
}
