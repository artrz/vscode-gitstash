/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as tmp from 'tmp'
import FileNode from './StashNode/FileNode'
import { FileStage } from './Git/StashGit'
import NodeContainer from './StashNode/NodeContainer'
import { Uri } from 'vscode'

export default class UriGenerator {
    public static readonly fileScheme = 'git-stash-file-content'
    private readonly supportedBinaryFiles = [
        '.bmp',
        '.gif',
        '.jpe',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
    ]

    constructor(
        private nodeContainer: NodeContainer,
    ) {
        tmp.setGracefulCleanup()
    }

    /**
     * Creates a node Uri to be used on Tree items.
     *
     * @param node  the node to be used as base for the URI
     */
    public createForTreeItem(node: FileNode): Uri {
        return Uri.parse(`${UriGenerator.fileScheme}:${node.path}?type=${node.type}&t=${new Date().getTime()}`)
    }

    /**
     * Creates a node Uri to be used on Tree items using a node path.
     */
    public createForNodePath(fileNode: FileNode): Uri | undefined {
        const currentPath = fileNode.isRenamed
            ? `${fileNode.parent.path}/${fileNode.oldName}`
            : fileNode.path

        return fs.existsSync(currentPath) ? Uri.file(currentPath) : undefined
    }

    /**
     * Creates a node Uri to be used on the diff view.
     *
     * @param node  the node to be used as base for the URI
     * @param stage the file stash stage
     */
    public async createForDiff(node: FileNode, stage?: FileStage): Promise<Uri> {
        if (this.supportedBinaryFiles.includes(path.extname(node.name))) {
            return Uri.file(
                this.createTmpFile(
                    await this.nodeContainer.getFileContents(node, stage),
                    node.name,
                ).name,
            )
        }

        return this.generateUri(node, stage)
    }

    /**
     * Generates an Uri representing the stash file.
     *
     * @param node the node to be used as base for the URI
     * @param side the editor side
     */
    private generateUri(node: FileNode, side?: string): Uri {
        const timestamp = new Date().getTime()

        const query = `cwd=${node.parent.path}`
            + `&index=${node.parent.index}`
            + `&path=${node.name}`
            + `&oldPath=${node.oldName}`
            + `&type=${node.type}`
            + `&side=${side ?? ''}`
            + `&t=${timestamp}`

        return Uri.parse(`${UriGenerator.fileScheme}:${node.path}?${query}`)
    }

    /**
     * Generates a tmp file with the given content.
     *
     * @param content  the string with the content
     * @param filename the string with the filename
     */
    private createTmpFile(content: string, filename: string): tmp.FileResult {
        const file = tmp.fileSync({
            prefix: 'vscode-gitstash-',
            postfix: path.extname(filename),
        })

        fs.writeFileSync(file.name, content)

        return file
    }
}
