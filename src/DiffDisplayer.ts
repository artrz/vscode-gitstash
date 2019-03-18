'use string';

import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import Model from './Model';
import StashLabels from './StashLabels';
import StashNode, { NodeType } from './StashNode';

export class DiffDisplayer {
    private model: Model;
    private stashLabels: StashLabels;

    constructor(model: Model, stashLabels: StashLabels) {
        this.model = model;
        this.stashLabels = stashLabels;

        tmp.setGracefulCleanup();
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode
     */
    public display(fileNode: StashNode) {
        if (fileNode.type === NodeType.Modified) {
            this.model.getStashedFile(fileNode).then((files) => {
                this.showDiff(
                    this.getResourceAsUri(files.base, fileNode),
                    this.getResourceAsUri(files.modified, fileNode),
                    fileNode,
                    true
                );
            });
        }
        else if (fileNode.type === NodeType.Untracked) {
            this.model.getFileContents(fileNode).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(),
                    this.getResourceAsUri(content, fileNode),
                    fileNode,
                    true
                );
            });
        }
        else if (fileNode.type === NodeType.IndexAdded) {
            this.model.getFileContents(fileNode).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(),
                    this.getResourceAsUri(content, fileNode),
                    fileNode,
                    true
                );
            });
        }
        else if (fileNode.type === NodeType.Deleted) {
            this.model.getFileContents(fileNode).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, fileNode),
                    this.getResourceAsUri(),
                    fileNode,
                    true
                );
            });
        }
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode
     */
    public diffCurrent(fileNode: StashNode) {
        const current = fileNode.path;
        if (!fs.existsSync(current)) {
            vscode.window.showErrorMessage('No file available to compare');
            return;
        }

        if (fileNode.type === NodeType.Modified) {
            this.model.getStashedFile(fileNode).then((files) => {
                this.showDiff(
                    this.getResourceAsUri(files.modified, fileNode),
                    vscode.Uri.file(current),
                    fileNode,
                    false
                );
            });
        }
        else if (fileNode.type === NodeType.Untracked) {
            this.model.getFileContents(fileNode).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, fileNode),
                    vscode.Uri.file(current),
                    fileNode,
                    false
                );
            });
        }
        else if (fileNode.type === NodeType.IndexAdded) {
            this.model.getFileContents(fileNode).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, fileNode),
                    vscode.Uri.file(current),
                    fileNode,
                    false
                );
            });
        }
        else if (fileNode.type === NodeType.Deleted) {
            this.model.getFileContents(fileNode).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, fileNode),
                    vscode.Uri.file(current),
                    fileNode,
                    false
                );
            });
        }
    }

    /**
     * Shows the diff view with the specified files.
     *
     * @param base     the resource uri of the file prior the modification
     * @param modified the resource uri of the file after the modification
     * @param fileNode the stash node that's being displayed
     * @param hint     the hint reference to know file origin
     */
    private showDiff(base: vscode.Uri, modified: vscode.Uri, fileNode: StashNode, hint: boolean) {
        vscode.commands.executeCommand<void>(
            'vscode.diff',
            base,
            modified,
            this.stashLabels.getDiffTitle(fileNode, hint),
            { preview: true }
        );
    }

    /**
     * Generates a resource uri for the resource content.
     *
     * @param content the resource content
     * @param node    the stash node that's being displayed
     */
    private getResourceAsUri(content?: Buffer | string, node?: StashNode): vscode.Uri {
        return content
            ? vscode.Uri.file(this.createTmpFile(content, node.name).name)
            : vscode.Uri.parse('empty-stash:');
    }

    /**
     * Generates a file with content.
     *
     * @param content  the buffer with the content
     * @param filename the string with the filename
     */
    private createTmpFile(content: Buffer | string, filename: string): tmp.SynchrounousResult {
        const file = tmp.fileSync({
            prefix: 'vscode-gitstash-',
            postfix: path.extname(filename)
        });

        fs.writeFileSync(file.name, content);

        return file;
    }
}
