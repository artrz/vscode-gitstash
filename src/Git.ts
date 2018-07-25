'use strict';

import { spawn } from 'child_process';
import { workspace } from 'vscode';

export default class Git {
    private gitRootPath: string;

    /**
     * Executes a git command.
     *
     * @param args the string array with the argument list
     * @param cwd  the optionally string with the current working directory
     */
    public async call(args: string[], cwd?: string): Promise<Buffer | string> {
        if (!cwd) {
            cwd = await this.getGitRoot();
        }

        const response = [];
        const errors = [];

        const cmd = spawn('git', args, { cwd });
        cmd.stderr.setEncoding('utf8');

        return new Promise<Buffer | string>((resolve, reject) => {
            cmd.stdout.on('data', (chunk: Buffer) => response.push(chunk));
            cmd.stdout.on('error', (err: Error) => errors.push(err.message));

            cmd.stderr.on('data', (chunk: string) => errors.push(chunk));
            cmd.stderr.on('error', (err: Error) => errors.push(err.message));

            cmd.on('close', () => {
                errors.length === 0
                    ? resolve(response.length ? Buffer.concat(response) : new Buffer(0))
                    : reject(errors.join(' '));
            });
        });
    }

    /**
     * Executes a git command.
     *
     * @param args     the string array with the argument list
     * @param cwd      the optionally string with the current working directory
     * @param encoding the string with the optional encoding to replace utf8
     */
    public async exec(args: string[], cwd?: string, encoding?: string): Promise<string> {
        return this
            .call(args, cwd)
            .then((data: Buffer | string) => {
                return data instanceof Buffer ? data.toString(encoding || 'utf8') : data;
            });
    }

    /**
     * Indicates if there's a current git repository.
     */
    public async hasGitRepository(): Promise<boolean> {
        return (await this.getGitRoot()).length > 0;
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
