'use string';

import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import Model from './Model';
import StashLabels from './StashLabels';
import StashNode, { NodeType } from './StashNode';

export class DiffDisplayer {
    private stashLabels: StashLabels;

    constructor(stashLabels: StashLabels) {
        this.stashLabels = stashLabels;

        tmp.setGracefulCleanup();
    }

    /**
     * Shows a stashed file diff document.
     */
    public display(model: Model, node: StashNode) {
        if (node.type === NodeType.Modified) {
            model.getStashedFile(node).then((files) => {
                const originalFile = this.createTmpFile(node.name, files.base, 'binary');
                const modifiedFile = this.createTmpFile(node.name, files.modified, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }

        else if (node.type === NodeType.Untracked) {
            model.getUntrackedFile(node).then((content) => {
                const originalFile = this.createTmpFile(node.name, null, 'binary');
                const modifiedFile = this.createTmpFile(node.name, content, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }

        else if (node.type === NodeType.IndexedUntracked) {
            model.getIndexedUntrackedFile(node).then((content) => {
                const originalFile = this.createTmpFile(node.name, null, 'binary');
                const modifiedFile = this.createTmpFile(node.name, content, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }

        else if (node.type === NodeType.Deleted) {
            model.getDeletedFile(node).then((content) => {
                const originalFile = this.createTmpFile(node.name, content, 'binary');
                const modifiedFile = this.createTmpFile(node.name, null, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }
    }

    /**
     * Shows the diff view with the specified files.
     *
     * @param node         the stash node that's being displayed
     * @param originalFile the contents of the file prior the modification
     * @param modifiedFile the contents of the file after the modification
     */
    private showDiff(node: StashNode, originalFile: tmp.SynchrounousResult, modifiedFile: tmp.SynchrounousResult) {
        vscode.commands.executeCommand<void>(
            'vscode.diff',
            vscode.Uri.file(originalFile.name),
            vscode.Uri.file(modifiedFile.name),
            this.stashLabels.getDiffTitle(node),
            { preview: true }
        );
    }

    /**
     * Generates a file with content.
     *
     * @param filename the string with the filename
     * @param content  the string with the content
     * @param encoding the string with the optional encoding to replace utf8
     */
    private createTmpFile(filename: string, content?: string, encoding?: string): tmp.SynchrounousResult {
        const file = tmp.fileSync({
            prefix: 'vscode-gitstash-',
            postfix: path.extname(filename)
        });

        if (content !== null) {
            fs.writeFileSync(file.name, content, encoding || 'utf8');
        }

        return file;
    }
}
