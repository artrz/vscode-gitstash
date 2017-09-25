'use strict';

import { workspace } from 'vscode';
import { spawn } from 'child_process';
import tmp from 'tmp';

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
        const params = [
            'stash',
            'list',
            '--date=iso'
        ];

        const stashList = (await this.exec(params)).trim();

        let list = [];

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
     * @param index The stash entry index
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

        let list = [];

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
     * @param index
     */
    public async getStashFileContents(index: number, file: string): Promise<string[]> {
        const paramsBase = [
            'show',
            `stash@{${index}}^1:${file}`,
        ];
        const paramsModified = [
            'show',
            `stash@{${index}}:${file}`,
        ];

        return [
            (await this.exec(paramsBase)).trim(),
            (await this.exec(paramsModified)).trim(),
        ];
    }

    /**
     * Executes a git command.
     *
     * @param args The argument list
     * @param cwd  The current working directory
     */
    private async exec(args: string[], cwd?: string): Promise<string> {
        if (!cwd) {
            cwd = await this.getGitRoot();
        }

        let content: string = '';
        let cmd = spawn('git', args, { cwd });

        let out = cmd.stdout;
        out.setEncoding('utf8');

        return new Promise<string>((resolve, reject) => {
            out.on('data', (data) => content += data);
            out.on('end', () => resolve(content));
            out.on('error', (err) => reject(err));
        });
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
