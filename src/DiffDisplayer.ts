/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

'use string'

import * as fs from 'fs'
import * as vscode from 'vscode'
import { FileStage } from './Git/StashGit'
import NodeType from './StashNode/NodeType'
import StashLabels from './StashLabels'
import StashNode from './StashNode/StashNode'
import UriGenerator from './uriGenerator'

export default class {
    private stashLabels: StashLabels
    private uriGenerator: UriGenerator

    constructor(uriGenerator: UriGenerator, stashLabels: StashLabels) {
        this.stashLabels = stashLabels
        this.uriGenerator = uriGenerator
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode
     */
    public async showDiff(fileNode: StashNode): Promise<void> {
        if (fileNode.type === NodeType.Modified || fileNode.type === NodeType.Renamed) {
            void this.displayDiff(
                await this.uriGenerator.createForDiff(fileNode, FileStage.Parent),
                await this.uriGenerator.createForDiff(fileNode, FileStage.Change),
                fileNode,
                true,
            )
            return
        }

        if (fileNode.type === NodeType.Untracked) {
            void this.displayDiff(
                await this.uriGenerator.createForDiff(),
                await this.uriGenerator.createForDiff(fileNode),
                fileNode,
                true,
            )
            return
        }

        if (fileNode.type === NodeType.IndexAdded) {
            void this.displayDiff(
                await this.uriGenerator.createForDiff(),
                await this.uriGenerator.createForDiff(fileNode),
                fileNode,
                true,
            )
            return
        }

        if (fileNode.type === NodeType.Deleted) {
            void this.displayDiff(
                await this.uriGenerator.createForDiff(fileNode),
                await this.uriGenerator.createForDiff(),
                fileNode,
                true,
            )
            return
        }
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode        the node fot the stashed file
     * @param compareChanges  compare changes or the changes' parent
     * @param currentAsParent show current file on the left side
     */
    public async showDiffCurrent(fileNode: StashNode, compareChanges: boolean, currentAsParent: boolean): Promise<unknown> {
        const current = fileNode.type === NodeType.Renamed
            ? `${fileNode.parent.path}/${fileNode.oldName}`
            : fileNode.path

        if (!fs.existsSync(current)) {
            return vscode.window.showErrorMessage(`File ${current} not found.`)
        }

        const currentFileUri = vscode.Uri.file(current)

        const diffDataUri = fileNode.type === NodeType.Modified || fileNode.type === NodeType.Renamed
            ? await this.uriGenerator.createForDiff(fileNode, compareChanges ? FileStage.Change : FileStage.Parent)
            : await this.uriGenerator.createForDiff(fileNode)

        return currentAsParent
            ? this.displayDiff(currentFileUri, diffDataUri, fileNode, false)
            : this.displayDiff(diffDataUri, currentFileUri, fileNode, false)
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
        if (!fs.existsSync(base.fsPath)) {
            void vscode.window.showWarningMessage(`File ${base.fsPath} not found.`)
        }

        return vscode.commands.executeCommand<unknown>(
            'vscode.diff',
            base,
            modified,
            this.stashLabels.getDiffTitle(fileNode, hint),
            {
                preserveFocus: true,
                preview: true,
                viewColumn: vscode.ViewColumn.Active,
            } as vscode.TextDocumentShowOptions,
        )
    }
}
