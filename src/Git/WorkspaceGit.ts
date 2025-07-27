'use strict'

import Config from '../Config'
import Git from './Git'
import { Uri } from 'vscode'
import * as Workspace from '../Workspace'

export default class WorkspaceGit extends Git {
    private config: Config

    constructor(config: Config) {
        super()
        this.config = config
    }

    /**
     * Indicates if there's at least one repository available.
     */
    public async hasGitRepository(): Promise<boolean> {
        const repository = await this.getRepositories(true)

        return repository.length > 0
    }

    /**
     * Gets the directories for git repositories on the workspace.
     *
     * @param firstOnly indicates if return only the first repository
     */
    public async getRepositories(firstOnly?: boolean): Promise<string[]> {
        const depth: number = this.config.get('advanced.repositorySearchDepth')

        const params = [
            'rev-parse',
            '--show-toplevel',
        ]

        const paths: string[] = []
        for (const cwd of Workspace.getRootPaths(depth)) {
            try {
                let gitPath = (await this.exec(params, cwd)).trim()
                if (gitPath.length < 1) {
                    continue
                }

                gitPath = Uri.file(gitPath).fsPath
                if (!paths.includes(gitPath)) {
                    paths.push(gitPath)

                    if (firstOnly) {
                        break
                    }
                }
            }
            catch (e) {
                console.error(e)
                continue
            }
        }

        paths.sort()

        return paths
    }
}
