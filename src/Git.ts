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

        let content = '';
        let error = '';

        const cmd = spawn('git', args, { cwd });

        const out = cmd.stdout;
        out.setEncoding('utf8');

        const err = cmd.stderr;
        err.setEncoding('utf8');

        return new Promise<string>((resolve, reject) => {
            out.on('data', (chunk: string) => content += chunk);
            err.on('data', (chunk: string) => error += chunk);
            out.on('error', (err) => reject(err));
            err.on('error', (err) => reject(err));
            cmd.on('close', () => {
                error.length > 0 ? reject(error) : resolve(content);
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
            stashList.split(/\r?\n/g).forEach((description, index) => {
                list.push({
                    index: index,
                    description: description.substring(description.indexOf('}:') + 2).trim(),
                    date: description.substring(description.indexOf('{') + 1, description.indexOf('}'))
                });
            });
        }

        return list;
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
     * Gets the file contents of both, the base (original) and the modified data.
     *
     * @param index the int with the index of the stashed file
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
            (await this.exec(paramsBase)),
            (await this.exec(paramsModified))
        ];
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
