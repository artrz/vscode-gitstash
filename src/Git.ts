'use strict';

import { workspace } from 'vscode';
import { spawn } from 'child_process';
import * as temp from 'tmp';

interface StashEntry {
    index: number;
    description: string;
    date: string;
}

interface StashFile {
    index: number;
    file: string;
}

export default class Git {

    private gitRootPath: string;

    /**
     * Executes a git command.
     *
     * @param args the string array with the argument list
     * @param cwd  the optionally string with the current working directory
     */
    public async exec(args: string[], cwd?: string): Promise<string> {
        if (!cwd) {
            cwd = await this.getGitRoot();
        }

        let result = '';
        let error = '';

        const cmd = spawn('git', args, { cwd });

        const out = cmd.stdout;
        out.setEncoding('utf8');

        const err = cmd.stderr;
        err.setEncoding('utf8');

        return new Promise<string>((resolve, reject) => {
            out.on('data', (chunk: string) => result += chunk);
            err.on('data', (chunk: string) => error += chunk);
            out.on('error', (err: Error) => error = err.message);
            err.on('error', (err: Error) => error = err.message);
            cmd.on('close', () => {
                error.trim().length === 0
                    ? resolve(result + error)
                    : reject(error);
            });
        });
    }

    /**
     * Indicates if there's a current git repository.
     */
    public async isGitRepository(): Promise<boolean> {
        return (await this.getGitRoot()).length > 0;
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
    public async getStashedFiles(index: number): Promise<any> {
        return {
            modified: await this.getStashFiles(index),
            untracked: await this.getStashUntracked(index)
        };
    }

    /**
     * Gets the stashed files of a stash entry.
     *
     * @param index the int with the index of the stash entry
     */
    public async getStashFiles(index: number): Promise<StashFile[]> {
        const params = [
            'stash',
            'show',
            '-p',
            '--name-only',
            `stash@{${index}}`
        ];

        const stashedFiles = (await this.exec(params)).trim();

        const list = [];

        stashedFiles.split(/\r?\n/g).forEach((file, index) => {
            list.push({
                index: index,
                file: file
            });
        });

        return list;
    }

    /**
     * Gets the untracked files of a stash entry.
     *
     * @param index the int with the index of the stash entry
     */
    public async getStashUntracked(index: number): Promise<StashFile[]> {
        const params = [
            'ls-tree',
            '-r',
            `stash@{${index}}^3`,
            '--name-only'
        ];

        const list = [];

        try {
            const untrackedFiles = (await this.exec(params)).trim();

            untrackedFiles.split(/\r?\n/g).forEach((file, index) => {
                list.push({
                    index: index,
                    file: file
                });
            });
        } catch (e) { }

        return list;
    }

    /**
     * Gets the file contents of both, the base (original) and the modified data.
     *
     * @param index the int with the index of the stashed file
     * @param file  the string with the stashed file name
     */
    public async getStashFileContents(index: number, file: string): Promise<string[]> {
        const paramsBase = [
            'show',
            `stash@{${index}}^1:${file}`
        ];
        const paramsModified = [
            'show',
            `stash@{${index}}:${file}`
        ];

        return [
            await this.exec(paramsBase),
            await this.exec(paramsModified)
        ];
    }

    /**
     * Gets the file contents of an untracked file.
     *
     * @param index the int with the index of the stashed file
     * @param file  the string with the stashed file name
     */
    public async untrackedFileContents(index: number, file: string): Promise<string> {
        const params = [
            'show',
            `stash@{${index}}^3:${file}`
        ];

        return await this.exec(params);
    }

    /**
     * Gets the root directory for the git project.
     */
    private async getGitRoot(): Promise<string> {
        if (!this.gitRootPath && workspace.rootPath) {
            const params = [
                'rev-parse',
                '--show-toplevel'
            ];

            this.gitRootPath = (await this.exec(params, workspace.rootPath)).trim();
        }

        return this.gitRootPath;
    }
}
