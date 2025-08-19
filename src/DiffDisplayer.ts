/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as vscode from 'vscode'
import FileNode from './StashNode/FileNode'
import { FileStage } from './Git/StashGit'
import StashLabels from './StashLabels'
import UriGenerator from './UriGenerator'

class DiffResource {
    originalUri: vscode.Uri | undefined
    modifiedUri: vscode.Uri | undefined
}

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
        const diff = await this.diffResource(fileNode)

        if (!diff.originalUri && diff.modifiedUri) { // 'Added' & 'Untracked'
            this.displayFile(diff.modifiedUri, fileNode)
        }
        else if (diff.originalUri && !diff.modifiedUri) { // 'Deleted' case
            this.displayFile(diff.originalUri, fileNode)
        }
        else {
            this.displayDiff(diff, fileNode, true)
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
    ): Promise<void> {
        const diffResource = await this.diffResourceCurrent(
            fileNode,
            sourceFile,
            sourceFileSide,
        )

        this.displayDiff(diffResource, fileNode, false)
    }

    private async diffResource(fileNode: FileNode): Promise<DiffResource> {
        if (fileNode.isAdded || fileNode.isUntracked) {
            return {
                originalUri: undefined,
                modifiedUri: await this.uriGenerator.createForDiff(fileNode),
            }
        }

        if (fileNode.isModified || fileNode.isRenamed) {
            return {
                originalUri: await this.uriGenerator.createForDiff(fileNode, FileStage.Parent),
                modifiedUri: await this.uriGenerator.createForDiff(fileNode, FileStage.Change),
            }
        }

        if (fileNode.isDeleted) {
            return {
                originalUri: await this.uriGenerator.createForDiff(fileNode),
                modifiedUri: undefined,
            }
        }

        throw new Error(`Invalid node type ${fileNode.type}.`)
    }

    public async diffResourceCurrent(
        fileNode: FileNode,
        sourceFile: FileStage,
        sourceFileSide: DiffSide,
    ): Promise<DiffResource> {
        const stashed = fileNode.isModified || fileNode.isRenamed
            ? await this.uriGenerator.createForDiff(fileNode, sourceFile)
            : await this.uriGenerator.createForDiff(fileNode)

        const current = this.uriGenerator.createForNodePath(fileNode)

        if (!current) {
            const name = fileNode.isRenamed ? fileNode.oldName : fileNode.name
            vscode.window.showWarningMessage(`File ${name} not found.`)
        }

        return sourceFileSide === DiffSide.Left
            ? { originalUri: stashed, modifiedUri: current }
            : { originalUri: current, modifiedUri: stashed }
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
        diffResource: DiffResource,
        fileNode: FileNode,
        hint: boolean,
    ): void {
        const title = this.stashLabels.getDiffTitle(fileNode, hint)

        vscode.commands.executeCommand(
            'vscode.diff',
            diffResource.originalUri,
            diffResource.modifiedUri,
            title,
            {
                preserveFocus: true,
                preview: true,
                viewColumn: vscode.ViewColumn.Active,
            })
    }

    private displayFile(file: vscode.Uri, fileNode: FileNode): void {
        vscode.commands.executeCommand('vscode.open', file, {
            preserveFocus: true,
            preview: true,
            viewColumn: vscode.ViewColumn.Active,
        }, this.stashLabels.getDiffTitle(fileNode, undefined))
    }
}
