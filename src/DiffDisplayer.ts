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

export const enum DiffSide {
    Left,
    Right,
}

export default class {
    constructor(
        private uriGenerator: UriGenerator,
        private stashLabels: StashLabels,
    ) {
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode
     */
    public async showDiff(fileNode: FileNode): Promise<void> {
        if (fileNode.isAdded) {
            const left = await this.uriGenerator.createForDiff()
            const right = await this.uriGenerator.createForDiff(fileNode)

            return void this.displayDiff(left, right, fileNode, true)
        }

        if (fileNode.isDeleted) {
            const left = await this.uriGenerator.createForDiff(fileNode)

            if (!fs.existsSync(fileNode.path)) {
                return void this.displayFile(left, fileNode)
            }

            const right = this.uriGenerator.createForNodePath(fileNode)

            return void this.displayDiff(left, right, fileNode, false)
        }

        if (fileNode.isModified || fileNode.isRenamed) {
            const left = await this.uriGenerator.createForDiff(fileNode, FileStage.Parent)
            const right = await this.uriGenerator.createForDiff(fileNode, FileStage.Change)

            return void this.displayDiff(left, right, fileNode, true)
        }

        if (fileNode.isUntracked) {
            const left = await this.uriGenerator.createForDiff()
            const right = await this.uriGenerator.createForDiff(fileNode)

            return void this.displayDiff(left, right, fileNode, true)
        }
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode        the node for the stashed file
     * @param sourceFile      compare changes or the changes' parent
     * @param sourceFileSide show node's file at left or right
     */
    public async showDiffCurrent(
        fileNode: FileNode,
        sourceFile: FileStage,
        sourceFileSide: DiffSide,
    ): Promise<unknown> {
        let current: vscode.Uri
        const currentPath = fileNode.isRenamed
            ? `${fileNode.parent.path}/${fileNode.oldName}`
            : fileNode.path

        const stashed = fileNode.isModified || fileNode.isRenamed
            ? await this.uriGenerator.createForDiff(fileNode, sourceFile)
            : await this.uriGenerator.createForDiff(fileNode)

        if (fs.existsSync(currentPath)) {
            current = vscode.Uri.file(currentPath)
        }
        else {
            current = await this.uriGenerator.createForDiff()
            vscode.window.showWarningMessage(`File ${currentPath} not found.`)
        }

        return sourceFileSide === DiffSide.Left
            ? this.displayDiff(stashed, current, fileNode, false)
            : this.displayDiff(current, stashed, fileNode, false)
    }

    /**
     * Shows the diff view with the specified files.
     *
     * @param left     the resource uri of the file prior the modification
     * @param right    the resource uri of the file after the modification
     * @param fileNode the stash node that's being displayed
     * @param hint     the hint reference to know file origin
     */
    private displayDiff(
        left: vscode.Uri,
        right: vscode.Uri,
        fileNode: FileNode,
        hint: boolean,
    ) {
        const title = this.stashLabels.getDiffTitle(fileNode, hint)

        return vscode.commands.executeCommand('vscode.diff', left, right, title, {
            preserveFocus: true,
            preview: true,
            viewColumn: vscode.ViewColumn.Active,
        })
    }

    private displayFile(file: vscode.Uri, fileNode: FileNode) {
        return vscode.commands.executeCommand('vscode.open', file, {
            preserveFocus: true,
            preview: true,
            viewColumn: vscode.ViewColumn.Active,
        }, this.stashLabels.getDiffTitle(fileNode, undefined))
    }
}
