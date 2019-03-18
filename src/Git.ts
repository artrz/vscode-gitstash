'use strict';

import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { workspace, WorkspaceFolder } from 'vscode';

export default class Git {
    /**
     * Executes a git command.
     *
     * @param args the string array with the argument list
     * @param cwd  the optionally string with the current working directory
     */
    public async call(args: string[], cwd?: string): Promise<Buffer | string> {
        if (!cwd) {
            cwd = await this.getDefaultRoot() || '';
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
                const bufferResponse = response.length ? Buffer.concat(response) : Buffer.from(new ArrayBuffer(0));
                errors.length === 0
                    ? resolve(bufferResponse)
                    : reject(`${errors.join(' ')}\n${bufferResponse.toString('utf8')}`.trim());
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
        const repository = await this.getRepositories(true);

        return repository && repository.length > 0;
    }

    /**
     * Gets the directory to be used as fallback.
     */
    private async getDefaultRoot(): Promise<string | null> {
        const repositories = await this.getRepositories(true);

        return repositories[0] || null;
    }

    /**
     * Gets the directories for git repositories on the workspace.
     */
    public async getRepositories(firstOnly?: boolean): Promise<string[]> {
        const params = [
            'rev-parse',
            '--show-toplevel'
        ];

        const paths = [];
        for (const cwd of this.getWorkspacePaths()) {
            let gitPath: string;
            try {
                gitPath = (await this.exec(params, cwd)).trim();
            } catch (e) {
                continue;
            }

            paths.push(gitPath);

            if (firstOnly) {
                break;
            }
        }

        return paths;
    }

    /**
     * Gets the workspace directory paths.
     */
    private getWorkspacePaths(): string[] {
        const folders = workspace.workspaceFolders || [];
        const paths = [];

        folders.forEach((folder: WorkspaceFolder) => {
            if (existsSync(folder.uri.fsPath)) {
                paths.push(folder.uri.fsPath);
            }
        });

        return paths;
    }
}
