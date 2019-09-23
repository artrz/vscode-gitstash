'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import { Uri } from 'vscode';
import Model from './Model';
import StashNode from './StashNode';
import { FileStage } from './StashGit';

export default class UriGenerator {
    public static readonly emptyFileScheme = 'gitdiff-no-contents';
    public static readonly fileScheme = 'gitdiff-stashed-contents';
    private readonly supportedBinaryFiles = [
        '.bmp',
        '.gif',
        '.jpe',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp'
    ];

    private model: Model;

    constructor(model: Model) {
        this.model = model;
        tmp.setGracefulCleanup();
    }

    /**
     * Creates an Uri for the given node.
     *
     * @param node  the node to be used as base for the URI
     * @param stage the file stash stage
     */
    public async create(node?: StashNode, stage?: FileStage): Promise<Uri> {
        if (!node) {
            return Uri.parse(`${UriGenerator.emptyFileScheme}:`);
        }

        if (this.supportedBinaryFiles.indexOf(path.extname(node.name)) > -1) {
            return Uri.file(
                this.createTmpFile(
                    await this.model.getFileContents(node, stage),
                    node.name
                ).name
            );
        }

        return this.generateUri(node, stage);
    }

    /**
     * Generates an Uri representing the stash file.
     *
     * @param node the node to be used as base for the URI
     * @param side the editor side
     */
    private generateUri(node: StashNode, side?: String): Uri {
        const timestamp = new Date().getTime();

        const query = `cwd=${node.parent.path}`
            + `&index=${node.parent.index}`
            + `&path=${node.name}`
            + `&oldPath=${node.oldName || ''}`
            + `&type=${node.type}`
            + `&side=${side || ''}`
            + `&t=${timestamp}`;

        return Uri.parse(`${UriGenerator.fileScheme}:${node.path}?${query}`);
    }

    /**
     * Generates a tmp file with the given content.
     *
     * @param content  the buffer with the content
     * @param filename the string with the filename
     */
    private createTmpFile(content: Buffer | string, filename: string): tmp.FileResult {
        const file = tmp.fileSync({
            prefix: 'vscode-gitstash-',
            postfix: path.extname(filename)
        });

        fs.writeFileSync(file.name, content);

        return file;
    }
}