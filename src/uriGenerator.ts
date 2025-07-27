'use strict'

import * as fs from 'fs'
import * as path from 'path'
import * as tmp from 'tmp'
import { FileStage } from './Git/StashGit'
import GitBridge from './GitBridge'
import StashNode from './StashNode/StashNode'
import { Uri } from 'vscode'

export default class UriGenerator {
    public static readonly emptyFileScheme = 'gitdiff-no-contents'
    public static readonly fileScheme = 'gitdiff-stashed-contents'
    private readonly supportedBinaryFiles = [
        '.bmp',
        '.gif',
        '.jpe',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
    ]

    private gitBridge: GitBridge

    constructor(gitBridge: GitBridge) {
        this.gitBridge = gitBridge
        tmp.setGracefulCleanup()
    }

    /**
     * Creates a node Uri to be used on Tree items.
     *
     * @param node  the node to be used as base for the URI
     */
    public createForTreeItem(node: StashNode): Uri {
        return Uri.parse(`${UriGenerator.fileScheme}:${node.path}?type=${node.type}&t=${new Date().getTime()}`)
    }

    /**
     * Creates a node Uri to be used on the diff view.
     *
     * @param node  the node to be used as base for the URI
     * @param stage the file stash stage
     */
    public async createForDiff(node?: StashNode, stage?: FileStage): Promise<Uri> {
        if (!node) {
            return Uri.parse(`${UriGenerator.emptyFileScheme}:`)
        }

        if (this.supportedBinaryFiles.includes(path.extname(node.name))) {
            return Uri.file(
                this.createTmpFile(
                    await this.gitBridge.getFileContents(node, stage),
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
    private generateUri(node: StashNode, side?: string): Uri {
        const timestamp = new Date().getTime()

        const query = `cwd=${node.parent.path}`
            + `&index=${node.parent.index}`
            + `&path=${node.name}`
            + `&oldPath=${node.oldName ?? ''}`
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
