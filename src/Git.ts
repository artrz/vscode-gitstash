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
