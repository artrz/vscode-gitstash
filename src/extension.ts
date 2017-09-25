'use strict';

import './init';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import GitStashTreeDataProvider from './GitStashTreeDataProvider'

export function activate(context: vscode.ExtensionContext) {
    const gitStashTreeDataProvider = new GitStashTreeDataProvider();

    vscode.window.registerTreeDataProvider('gitstash.explorer', gitStashTreeDataProvider);

    vscode.commands.registerCommand('gitstash.show', (model, node) => {
        model.getStashedFile(node).then(result => {
            const baseFile = getFile(node.name, result.base);
            const modifiedFile = getFile(node.name, result.modified);

            vscode.commands.executeCommand<void>(
                'vscode.diff',
                vscode.Uri.file(baseFile.name),
                vscode.Uri.file(modifiedFile.name),
                `stash@{${node.parent.index}}:${path.basename(node.name)}`,
                { preview: true }
            );
        });
    });

    const watcher = vscode.workspace.createFileSystemWatcher('**', false, false, false);
    watcher.onDidCreate((event) => { gitStashTreeDataProvider.reload(event, 'c'); });
    watcher.onDidChange((event) => { gitStashTreeDataProvider.reload(event, 'u'); });
    watcher.onDidDelete((event) => { gitStashTreeDataProvider.reload(event, 'd'); });
}

function getFile(filename: string, content: string): any {
    const file = tmp.fileSync({ postfix: path.extname(filename) });
    fs.writeFileSync(file.name, content);

    return file;
}
