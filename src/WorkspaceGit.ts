'use strict';

import { Uri } from 'vscode';
import Git from './Git';
import Workspace from './Workspace';
import Config from './Config';

export default class WorkspaceGit extends Git {
    private config: Config;

    constructor(config: Config) {
        super();
        this.config = config;
    }

    /**
     * Indicates if there's at least one repository available.
     */
    public async hasGitRepository(): Promise<boolean> {
        const repository = await this.getRepositories(true);

        return repository && repository.length > 0;
    }

    /**
     * Gets the directories for git repositories on the workspace.
     *
     * @param firstOnly indicates if return only the first repository
     */
    public async getRepositories(firstOnly?: boolean): Promise<string[]> {
        const depth = this.config.settings.advanced.repositorySearchDepth;

        const params = [
            'rev-parse',
            '--show-toplevel'
        ];

        const paths = [];
        for (const cwd of Workspace.getRootPaths(depth)) {
            try {
                let gitPath = (await this.exec(params, cwd)).trim();
                if (gitPath.length < 1) {
                    continue;
                }

                gitPath = Uri.file(gitPath).fsPath;
                if (paths.indexOf(gitPath) === -1) {
                    paths.push(gitPath);

                    if (firstOnly) {
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        paths.sort();

        return paths;
    }
}
