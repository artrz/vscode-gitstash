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
    untracked: string[];
    indexAdded: string[];
    modified: string[];
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
        const files = {
            untracked: await this.getStashUntracked(cwd, index),
            indexAdded: [],
            modified: [],
            deleted: []
        };

        const params = [
            'stash',
            'show',
            '--numstat',
            '--summary',
            `stash@{${index}}`
        ];

        const stashData = (await this.exec(params, cwd)).trim();

        stashData.split(/\r?\n/g).forEach((line: string) => {
            const fileSummary = line.match(/\s*(.+)\s+(.+)\s+(.+)\s+(.+)/);
            if (fileSummary !== null) {
                const stat = fileSummary[1].toLowerCase();
                const file = fileSummary[4];
                if (stat === 'create') {
                    files.indexAdded.push(file);
                }
                else if (stat === 'delete') {
                    files.deleted.push(file);
                }
            }
        });

        stashData.split(/\r?\n/g).forEach((line: string) => {
            const fileStats = line.match(/(\s*\d+\s+\d+\s+(.+))|(\s*-\s+-\s+(.+))/);
            if (fileStats !== null) {
                const file = fileStats[2] || fileStats[4];
                if (files.indexAdded.indexOf(file) !== -1) {
                    return;
                }
                if (files.deleted.indexOf(file) !== -1) {
                    return;
                }
                files.modified.push(file);
            }
        });

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
            `stash@{${index}}^3`,
            '--name-only'
        ];

        const list = [];

        try {
            const untrackedFiles = (await this.exec(params, cwd)).trim();

            if (untrackedFiles.length > 0) {
                untrackedFiles.split(/\r?\n/g).forEach((file: string) => {
                    list.push(file);
                });
            }
        } catch (e) { }

        return list;
    }

    /**
     * Gets the file contents of both, the base (original) and the modified data.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async getStashFileContents(cwd: string, index: number, file: string): Promise<StashedFileContents> {
        const paramsModified = [
            'show',
            `stash@{${index}}:${file}`
        ];

        const paramsBase = [
            'show',
            `stash@{${index}}^1:${file}`
        ];

        return {
            base: await this.call(paramsBase, cwd),
            modified: await this.call(paramsModified, cwd)
        };
    }

    /**
     * Gets the file contents of an untracked file.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async untrackedFileContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        const params = [
            'show',
            `stash@{${index}}^3:${file}`
        ];

        return await this.call(params, cwd);
    }

    /**
     * Gets the file contents of an index added file.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async indexAddedFileContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        const params = [
            'show',
            `stash@{${index}}:${file}`
        ];

        return await this.call(params, cwd);
    }

    /**
     * Gets the file contents of a deleted file.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async deletedFileContents(cwd: string, index: number, file: string): Promise<Buffer | string> {
        const params = [
            'show',
            `stash@{${index}}^1:${file}`
        ];

        return await this.call(params, cwd);
    }
}
