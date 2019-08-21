'use strict';

import { workspace } from 'vscode';
import Git from './Git';

export interface Stash {
    index: number;
    description: string;
    date: string;
}

export interface StashedFileContents {
    base: Buffer | string;
    modified: Buffer | string;
}

export interface StashedFiles {
    indexAdded: string[];
    modified: string[];
    renamed: any[];
    untracked: string[];
    deleted: string[];
}

export default class StashGit extends Git {
    /**
     * Gets the raw git stash command data.
     *
     * @param cwd the current working directory
     */
    public async getRawStash(cwd: string): Promise<string> {
        const params = [
            'stash',
            'list'
        ];

        return (await this.exec(params, cwd)).trim();
    }

    /**
     * Indicates if there's something able to be stashed.
     *
     * @param cwd the current working directory
     */
    public async isStashable(cwd: string): Promise<boolean> {
        const paramsModifiedAndDeleted = [
            'diff',
            '--name-only'
        ];

        const paramsUntracked = [
            'ls-files',
            '--others',
            '--exclude-standard'
        ];

        const paramsStaged = [
            'diff',
            '--cached',
            '--name-only'
        ];

        const modifiedFiles = await this.exec(paramsModifiedAndDeleted, cwd);
        const untrackedFiles = await this.exec(paramsUntracked, cwd);
        const stagedFiles = await this.exec(paramsStaged, cwd);

        return modifiedFiles.trim().length > 0
            || untrackedFiles.trim().length > 0
            || stagedFiles.trim().length > 0;
    }

    /**
     * Gets the stashes list.
     *
     * @param cwd the current working directory
     */
    public async getStashes(cwd: string): Promise<Stash[]> {
        const validFormats = ['default', 'iso', 'local', 'raw', 'relative', 'rfc', 'short'];
        const dateFormat = workspace.getConfiguration('gitstash').dateFormat;
        const params = [
            'stash',
            'list',
            '--date=' + (validFormats.indexOf(dateFormat) > -1 ? dateFormat : 'default')
        ];

        const stashList = (await this.exec(params, cwd)).trim();

        const list = [];

        if (stashList.length > 0) {
            stashList.split(/\r?\n/g).forEach((stash, index) => {
                list.push({
                    index: index,
                    description: stash.substring(stash.indexOf('}:') + 2).trim(),
                    date: stash.substring(stash.indexOf('{') + 1, stash.indexOf('}'))
                });
            });
        }

        return list;
    }

    /**
     * Gets the stash files.
     *
     * @param cwd   the current working directory
     * @param index the int with the stash index
     */
    public async getStashedFiles(cwd: string, index: number): Promise<StashedFiles> {
        const files: StashedFiles = {
            untracked: await this.getStashUntracked(cwd, index),
            indexAdded: [],
            modified: [],
            deleted: [],
            renamed: [],
        };

        const params = [
            'stash',
            'show',
            '--name-status',
            `stash@{${index}}`
        ];

        try {
            const stashData = (await this.exec(params, cwd)).trim();

            if (stashData.length > 0) {
                const stashedFiles = stashData.split(/\r?\n/g);
                stashedFiles.forEach((line: string) => {
                    const status = line.substring(0, 1);
                    const file = line.substring(1).trim();

                    if (status === 'A') {
                        files.indexAdded.push(file);
                    }
                    else if (status === 'D') {
                        files.deleted.push(file);
                    }
                    else if (status === 'M') {
                        files.modified.push(file);
                    }
                    else if (status === 'R') {
                        const fileNames = file.match(/^\d+\s+([^\t]+)\t(.+)$/);
                        files.renamed.push({
                            new: fileNames[2],
                            old: fileNames[1],
                        });
                    }
                });
            }
        } catch (e) {
            console.log('StashGit.getStashedFiles', e);
        }

        return files;
    }

    /**
     * Gets the stash untracked files.
     *
     * @param cwd   the current working directory
     * @param index the int with the stash index
     */
    private async getStashUntracked(cwd: string, index: number): Promise<string[]> {
        const params = [
            'ls-tree',
            '-r',
            '--name-only',
            `stash@{${index}}^3`
        ];

        const list = [];

        try {
            const stashData = (await this.exec(params, cwd)).trim();

            if (stashData.length > 0) {
                const stashedFiles = stashData.split(/\r?\n/g);
                stashedFiles.forEach((file: string) => {
                    list.push(file);
                });
            }
        } catch (e) { /* we may get an error if there aren't untracked files */ }

        return list;
    }

    /**
     * Gets the contents of a deleted file.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async deletedFileContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        return await this.getParentContents(cwd, index, file);
    }

    /**
     * Gets the contents of an index added file.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async indexAddedFileContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        return await this.getStashContents(cwd, index, file);
    }

    /**
     * Gets the contents of both, the base (original) and the modified data.
     *
     * @param cwd     the current working directory
     * @param index   the int with the index of the parent stash
     * @param file    the string with the stashed file name
     * @param oldFile the string with the stashed original file name if its a renamed file
     */
    public async getStashFileContents(cwd: string, index: number, file: string, oldFile?: string): Promise<StashedFileContents> {
        return {
            base: await this.getParentContents(cwd, index, oldFile || file),
            modified: await this.getStashContents(cwd, index, file)
        };
    }

    /**
     * Gets the contents of an untracked file.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async untrackedFileContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        return await this.getThirdParentStashContents(cwd, index, file);
    }

    /**
     * Gets the file contents from the stash commit.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    private async getStashContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        const params = [
            'show',
            `stash@{${index}}:${file}`
        ];

        return await this.call(params, cwd);
    }

    /**
     * Gets the file contents from the parent stash commit.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    private async getParentContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        const params = [
            'show',
            `stash@{${index}}^1:${file}`
        ];

        return await this.call(params, cwd);
    }

    /**
     * Gets the file contents from the third (untracked) stash commit.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    private async getThirdParentStashContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        const params = [
            'show',
            `stash@{${index}}^3:${file}`
        ];

        return await this.call(params, cwd);
    }
}
