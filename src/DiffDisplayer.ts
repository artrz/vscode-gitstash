/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as fs from 'fs'
import * as vscode from 'vscode'
import FileNode from './StashNode/FileNode'
import { FileStage } from './Git/StashGit'
import StashLabels from './StashLabels'
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
    public async showDiff(fileNode: FileNode): Promise<void> {
        if (fileNode.isAdded) {
            return void this.displayDiff(
                await this.uriGenerator.createForDiff(),
                await this.uriGenerator.createForDiff(fileNode),
                fileNode,
                true,
            )
        }

        if (fileNode.isDeleted) {
            return void this.displayDiff(
                await this.uriGenerator.createForDiff(fileNode),
                await this.uriGenerator.createForDiff(),
                fileNode,
                true,
            )
        }

        if (fileNode.isModified || fileNode.isRenamed) {
            return void this.displayDiff(
                await this.uriGenerator.createForDiff(fileNode, FileStage.Parent),
                await this.uriGenerator.createForDiff(fileNode, FileStage.Change),
                fileNode,
                true,
            )
        }

        if (fileNode.isUntracked) {
            return void this.displayDiff(
                await this.uriGenerator.createForDiff(),
                await this.uriGenerator.createForDiff(fileNode),
                fileNode,
                true,
            )
        }
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode        the node fot the stashed file
     * @param compareChanges  compare changes or the changes' parent
     * @param currentAsParent show current file on the left side
     */
    public async showDiffCurrent(fileNode: FileNode, compareChanges: boolean, currentAsParent: boolean): Promise<unknown> {
        const current = fileNode.isRenamed
            ? `${fileNode.parent.path}/${fileNode.oldName}`
            : fileNode.path

        if (!fs.existsSync(current)) {
            return vscode.window.showErrorMessage(`File ${current} not found.`)
        }

        const currentFileUri = vscode.Uri.file(current)

        const diffDataUri = fileNode.isModified || fileNode.isRenamed
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
    private displayDiff(base: vscode.Uri, modified: vscode.Uri, fileNode: FileNode, hint: boolean) {
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
