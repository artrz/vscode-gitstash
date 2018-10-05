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
     * @param node
     */
    public display(node: StashNode) {
        if (node.type === NodeType.Modified) {
            this.model.getStashedFile(node).then((files) => {
                this.showDiff(
                    this.getResourceAsUri(files.base, node),
                    this.getResourceAsUri(files.modified, node),
                    node
                );
            });
        }
        else if (node.type === NodeType.Untracked) {
            this.model.getUntrackedFile(node).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(),
                    this.getResourceAsUri(content, node),
                    node
                );
            });
        }
        else if (node.type === NodeType.IndexAdded) {
            this.model.getIndexAddedFile(node).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(),
                    this.getResourceAsUri(content, node),
                    node
                );
            });
        }
        else if (node.type === NodeType.Deleted) {
            this.model.getDeletedFile(node).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, node),
                    this.getResourceAsUri(),
                    node
                );
            });
        }
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param node
     */
    public diffCurrent(node: StashNode) {
        const current = node.path;
        if (!current) {
            vscode.window.showErrorMessage('No file available to compare');
            return;
        }

        if (node.type === NodeType.Modified) {
            this.model.getStashedFile(node).then((files) => {
                this.showDiff(
                    this.getResourceAsUri(files.modified, node),
                    vscode.Uri.parse(`file://${current}`),
                    node
                );
            });
        }
        else if (node.type === NodeType.Untracked) {
            this.model.getUntrackedFile(node).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, node),
                    vscode.Uri.parse(`file://${current}`),
                    node
                );
            });
        }
        else if (node.type === NodeType.IndexAdded) {
            this.model.getIndexAddedFile(node).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, node),
                    vscode.Uri.parse(`file://${current}`),
                    node
                );
            });
        }
        else if (node.type === NodeType.Deleted) {
            this.model.getDeletedFile(node).then((content) => {
                this.showDiff(
                    this.getResourceAsUri(content, node),
                    vscode.Uri.parse(`file://${current}`),
                    node
                );
            });
        }
    }

    /**
     * Shows the diff view with the specified files.
     *
     * @param base     the resource uri of the file prior the modification
     * @param modified the resource uri of the file after the modification
     * @param node     the stash node that's being displayed
     */
    private showDiff(base: vscode.Uri, modified: vscode.Uri, node: StashNode) {
        vscode.commands.executeCommand<void>(
            'vscode.diff',
            base,
            modified,
            this.stashLabels.getDiffTitle(node),
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
