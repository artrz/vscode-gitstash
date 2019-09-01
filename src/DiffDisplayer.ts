'use string';

import * as fs from 'fs';
import * as vscode from 'vscode';
import StashLabels from './StashLabels';
import StashNode, { NodeType } from './StashNode';
import UriGenerator from './uriGenerator';
import { FileStage } from './StashGit';

export class DiffDisplayer {
    private stashLabels: StashLabels;
    private uriGenerator: UriGenerator;

    constructor(uriGenerator: UriGenerator, stashLabels: StashLabels) {
        this.stashLabels = stashLabels;
        this.uriGenerator = uriGenerator;
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode
     */
    public async showDiff(fileNode: StashNode) {
        if (fileNode.type === NodeType.Modified || fileNode.type === NodeType.Renamed) {
            this.displayDiff(
                await this.uriGenerator.create(fileNode, FileStage.Parent),
                await this.uriGenerator.create(fileNode, FileStage.Change),
                fileNode,
                true
            );
        }
        else if (fileNode.type === NodeType.Untracked) {
            this.displayDiff(
                await this.uriGenerator.create(),
                await this.uriGenerator.create(fileNode),
                fileNode,
                true
            );
        }
        else if (fileNode.type === NodeType.IndexAdded) {
            this.displayDiff(
                await this.uriGenerator.create(),
                await this.uriGenerator.create(fileNode),
                fileNode,
                true
            );
        }
        else if (fileNode.type === NodeType.Deleted) {
            this.displayDiff(
                await this.uriGenerator.create(fileNode),
                await this.uriGenerator.create(),
                fileNode,
                true
            );
        }
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode
     */
    public async showDiffCurrent(fileNode: StashNode) {
        const current = fileNode.type === NodeType.Renamed
            ? `${fileNode.parent.path}/${fileNode.oldName}`
            : fileNode.path;

        if (!fs.existsSync(current)) {
            vscode.window.showErrorMessage('No file available to compare');
            return;
        }

        if (fileNode.type === NodeType.Modified || fileNode.type === NodeType.Renamed) {
            this.displayDiff(
                await this.uriGenerator.create(fileNode, FileStage.Change),
                vscode.Uri.file(current),
                fileNode,
                false
            );
        }
        else if (fileNode.type === NodeType.Untracked) {
            this.displayDiff(
                await this.uriGenerator.create(fileNode),
                vscode.Uri.file(current),
                fileNode,
                false
            );
        }
        else if (fileNode.type === NodeType.IndexAdded) {
            this.displayDiff(
                await this.uriGenerator.create(fileNode),
                vscode.Uri.file(current),
                fileNode,
                false
            );
        }
        else if (fileNode.type === NodeType.Deleted) {
            this.displayDiff(
                await this.uriGenerator.create(fileNode),
                vscode.Uri.file(current),
                fileNode,
                false
            );
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
    private displayDiff(base: vscode.Uri, modified: vscode.Uri, fileNode: StashNode, hint: boolean) {
        vscode.commands.executeCommand<void>(
            'vscode.diff',
            base,
            modified,
            this.stashLabels.getDiffTitle(fileNode, hint),
            {
                preserveFocus: true,
                preview: true,
                viewColumn: vscode.ViewColumn.Active
            } as vscode.TextDocumentShowOptions
        );
    }
}
