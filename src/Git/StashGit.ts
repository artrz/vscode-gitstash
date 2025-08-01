/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import Git from './Git'

export interface Stash {
    index: number;
    date: string;
    hash: string;
    description: string;
}

export interface RenameStash {
    new: string;
    old: string;
}

export interface StashedFiles {
    indexAdded: string[];
    modified: string[];
    renamed: RenameStash[];
    untracked: string[];
    deleted: string[];
}

export const enum FileStage {
    Parent = 'p',
    Change = 'c',
}

export default class StashGit extends Git {
    /**
     * Gets the raw git stash command data.
     *
     * @param cwd the current working directory
     */
    public async getRawStash(cwd: string): Promise<null | string> {
        const params = [
            'stash',
            'list',
        ]

        return (await this.exec(params, cwd)).trim() || null
    }

    /**
     * Gets the stashes list.
     *
     * @param cwd the current working directory
     */
    public async getStashes(cwd: string): Promise<Stash[]> {
        const params = [
            'stash',
            'list',
            '--format="%ci %h %s"',
        ]

        const stashList = (await this.exec(params, cwd)).trim()

        const sep1 = 26 // date length
        const sep2 = 34 // date length + (1) space + (7) hash length

        const list: Stash[] = !stashList.length
            ? []
            : stashList
                .split(/\r?\n/g)
                .map((stash, index) => ({
                    index,
                    date: stash.substring(1, sep1),
                    hash: stash.substring(sep1 + 1, sep2),
                    description: stash.substring(sep2 + 1).slice(0, -1).trim(),
                }))

        return list
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
            renamed: [] as RenameStash[],
        }

        const params = [
            'stash',
            'show',
            '--name-status',
            `stash@{${index}}`,
        ]

        try {
            const stashData = (await this.exec(params, cwd)).trim()

            if (stashData.length > 0) {
                const stashedFiles = stashData.split(/\r?\n/g)
                stashedFiles.forEach((line: string) => {
                    const status = line.substring(0, 1)
                    const file = line.substring(1).trim()

                    if (status === 'A') {
                        files.indexAdded.push(file)
                    }
                    else if (status === 'D') {
                        files.deleted.push(file)
                    }
                    else if (status === 'M') {
                        files.modified.push(file)
                    }
                    else if (status === 'R') {
                        const fileNames = /^\d+\s+([^\t]+)\t(.+)$/.exec(file) as string[]
                        files.renamed.push({
                            new: fileNames[2],
                            old: fileNames[1],
                        })
                    }
                })
            }
        }
        catch (e) {
            console.log('StashGit.getStashedFiles')
            console.log(e)
        }

        return files
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
            `stash@{${index}}^3`,
        ]

        const list: string[] = []

        try {
            const stashData = (await this.exec(params, cwd)).trim()

            if (stashData.length > 0) {
                const stashedFiles = stashData.split(/\r?\n/g)
                stashedFiles.forEach((file: string) => {
                    list.push(file)
                })
            }
        }
        catch (e) {
            /* we may get an error if there aren't untracked files */
            console.log(e)
        }

        return list
    }

    /**
     * Gets the file contents from the stash commit.
     *
     * This gets the changed contents for:
     *  - index-added
     *  - modified
     *  - renamed
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async getStashContents(cwd: string, index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}:${file}`,
        ]

        return this.exec(params, cwd)
    }

    /**
     * Gets the file contents from the parent stash commit.
     *
     * This gets the original contents for:
     *  - deleted
     *  - modified
     *  - renamed
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async getParentContents(cwd: string, index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}^1:${file}`,
        ]

        return this.exec(params, cwd)
    }

    /**
     * Gets the file contents from the third (untracked) stash commit.
     *
     * @param cwd   the current working directory
     * @param index the int with the index of the parent stash
     * @param file  the string with the stashed file name
     */
    public async getThirdParentContents(cwd: string, index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}^3:${file}`,
        ]

        return this.exec(params, cwd)
    }
}
