'use strict';

import { spawn } from 'child_process';
import { workspace } from 'vscode';
import Git from './Git';

export interface StashEntry {
    index: number;
    description: string;
    date: string;
}

export interface StashedFileContents {
    base: string;
    modified: string;
}

export interface StashedFiles {
    untracked: string[];
    indexedUntracked: string[];
    modified: string[];
    deleted: string[];
}

export default class StashGit extends Git {
    /**
     * Indicates if there's something able to be stashed.
     */
    public async isStashable(): Promise<boolean> {
        const paramsModifiednDeleted = [
            'diff',
            '--name-only'
        ];

        const paramsUntracked = [
            'ls-files',
            '--others',
            '--exclude-standard'
        ];

        const modifiedFiles = (await this.exec(paramsModifiednDeleted)).trim().length > 0;
        const untrackedFiles = (await this.exec(paramsUntracked)).trim().length > 0;

        return modifiedFiles || untrackedFiles;
    }

    /**
     * Gets the raw git stash command data.
     */
    public async getRawStash(): Promise<string> {
        const params = [
            'stash',
            'list'
        ];

        return (await this.exec(params)).trim();
    }

    /**
     * Gets the stash entries list.
     */
    public async getStashList(): Promise<StashEntry[]> {
        const validFormats = ['default', 'iso', 'local', 'raw', 'relative', 'rfc', 'short'];
        const dateFormat = workspace.getConfiguration('gitstash').dateFormat;
        const params = [
            'stash',
            'list',
            '--date=' + (validFormats.indexOf(dateFormat) > -1 ? dateFormat : 'default')
        ];

        const stashList = (await this.exec(params)).trim();

        const list = [];

        if (stashList.length > 0) {
            stashList.split(/\r?\n/g).forEach((entry, index) => {
                list.push({
                    index: index,
                    description: entry.substring(entry.indexOf('}:') + 2).trim(),
                    date: entry.substring(entry.indexOf('{') + 1, entry.indexOf('}'))
                });
            });
        }

        return list;
    }

    /**
     * Gets the files of a stash entry.
     *
     * @param index the int with the index of the stash entry
     */
    public async getStashedFiles(index: number): Promise<StashedFiles> {
        const entryFiles = {
            untracked: await this.getStashUntracked(index),
            indexedUntracked: [],
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

        const stashData = (await this.exec(params)).trim();

        stashData.split(/\r?\n/g).forEach((line: string) => {
            const fileSummary = line.match(/\s*(.+)\s+(.+)\s+(.+)\s+(.+)/);
            if (fileSummary !== null) {
                const stat = fileSummary[1].toLowerCase();
                const file = fileSummary[4];
                if (stat === 'create') {
                    entryFiles.indexedUntracked.push(file);
                }
                else if (stat === 'delete') {
                    entryFiles.deleted.push(file);
                }
            }

        });

        stashData.split(/\r?\n/g).forEach((line: string) => {
            const fileStats = line.match(/\s*(\d+)\s+(\d+)\s+(.+)/);
            if (fileStats !== null) {
                const file = fileStats[3];
                if (entryFiles.indexedUntracked.indexOf(file) !== -1) {
                    return;
                }
                if (entryFiles.deleted.indexOf(file) !== -1) {
                    return;
                }
                entryFiles.modified.push(file);
            }
        });

        return entryFiles;
    }

    /**
     * Gets the untracked files of a stash entry.
     *
     * @param index the int with the index of the stash entry
     */
    public async getStashUntracked(index: number): Promise<string[]> {
        const params = [
            'ls-tree',
            '-r',
            `stash@{${index}}^3`,
            '--name-only'
        ];

        const list = [];

        try {
            const untrackedFiles = (await this.exec(params)).trim();

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
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async getStashFileContents(index: number, file: string): Promise<StashedFileContents> {
        const paramsModified = [
            'show',
            `stash@{${index}}:${file}`
        ];

        const paramsBase = [
            'show',
            `stash@{${index}}^1:${file}`
        ];

        return {
            base: await this.exec(paramsBase),
            modified: await this.exec(paramsModified)
        };
    }

    /**
     * Gets the file contents of an untracked file.
     *
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async untrackedFileContents(index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}^3:${file}`
        ];

        return await this.exec(params, null, 'binary');
    }

    /**
     * Gets the file contents of an indexed untracked file.
     *
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async indexedUntrackedFileContents(index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}:${file}`
        ];

        return await this.exec(params, null, 'binary');
    }

    /**
     * Gets the file contents of a deleted file.
     *
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async deletedFileContents(index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}^1:${file}`
        ];

        return await this.exec(params, null, 'binary');
    }
}
