/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as vscode from 'vscode'
import Config from './Config'
import FileNode from './StashNode/FileNode'
import Node from './StashNode/Node'
import RepositoryNode from './StashNode/RepositoryNode'
import StashGit from './Git/StashGit'
import StashLabels from './StashLabels'
import StashNode from './StashNode/StashNode'
import WorkspaceGit from './Git/WorkspaceGit'
import { toDateTimeIso } from './DateFormat'

enum StashType {
    Simple,
    KeepIndex,
    IncludeUntracked,
    IncludeUntrackedKeepIndex,
    All,
    AllKeepIndex,
}

enum NotificationType {
    Warning = 'warning',
    Message = 'message',
    Error = 'error',
}

export class StashCommands {
    static StashType = StashType

    private config: Config
    private workspaceGit: WorkspaceGit
    private channel: vscode.OutputChannel
    private stashGit: StashGit
    private stashLabels: StashLabels

    constructor(config: Config, workspaceGit: WorkspaceGit, channel: vscode.OutputChannel, stashLabels: StashLabels) {
        this.config = config
        this.workspaceGit = workspaceGit
        this.channel = channel
        this.stashLabels = stashLabels
        this.stashGit = new StashGit()
    }

    /**
     * Generates a stash.
     */
    public stash = (repositoryNode: RepositoryNode, type: StashType, message?: string): void => {
        const params = ['stash', 'save']

        switch (type) {
            case StashType.KeepIndex:
                params.push('--keep-index')
                break
            case StashType.IncludeUntracked:
                params.push('--include-untracked')
                break
            case StashType.IncludeUntrackedKeepIndex:
                params.push('--include-untracked')
                params.push('--keep-index')
                break
            case StashType.All:
                params.push('--all')
                break
            case StashType.AllKeepIndex:
                params.push('--all')
                params.push('--keep-index')
                break
        }

        if (message?.length) {
            params.push(message)
        }

        this.exec(repositoryNode.path, params, 'Stash created', repositoryNode)
    }

    /**
     * Creates stashes for the given files across multiple repositories.
     *
     * @param filePaths    an array with the list of the file paths to stash
     * @param stashMessage an optional message to set on the stash
     */
    public push = (filePaths: string[], stashMessage?: string): void => {
        const params = ['stash', 'push']

        if (stashMessage) {
            params.push('-m', stashMessage)
        }

        const paths: (string | null)[] = filePaths
        void this.workspaceGit.getRepositories().then((repositoryPaths: string[]) => {
            const repositories: Record<string, string[]> = {}
            repositoryPaths
                .sort()
                .reverse()
                .forEach((repoPath) => {
                    for (let i = 0; i < paths.length; i += 1) {
                        const filePath = paths[i]
                        if (filePath?.startsWith(repoPath)) {
                            repositories[repoPath] = [filePath].concat(repositories[repoPath])
                            paths[i] = null
                        }
                    }
                })

            Object.keys(repositories).forEach((repoPath) => {
                this.exec(repoPath, params.concat(repositories[repoPath]), 'Selected files stashed')
            })
        })
    }

    /**
     * Removes the stashes list.
     */
    public clear = (repositoryNode: RepositoryNode): void => {
        const params = ['stash', 'clear']

        this.exec(repositoryNode.path, params, 'Stash list cleared', repositoryNode)
    }

    /**
     * Pops a stash.
     */
    public pop = (stashNode: StashNode, withIndex: boolean): void => {
        const params = ['stash', 'pop']

        if (withIndex) {
            params.push('--index')
        }

        params.push(stashNode.atIndex)

        this.exec(stashNode.path, params, 'Stash popped', stashNode)
    }

    /**
     * Applies a stash.
     */
    public apply = (stashNode: StashNode, withIndex: boolean): void => {
        const params = ['stash', 'apply']

        if (withIndex) {
            params.push('--index')
        }

        params.push(stashNode.atIndex)

        this.exec(stashNode.path, params, 'Stash applied', stashNode)
    }

    /**
     * Branches a stash.
     */
    public branch = (stashNode: StashNode, name: string): void => {
        const params = [
            'stash',
            'branch',
            name,
            stashNode.atIndex,
        ]

        this.exec(stashNode.path, params, 'Stash branched', stashNode)
    }

    /**
     * Drops a stash.
     */
    public drop = (stashNode: StashNode): void => {
        const params = [
            'stash',
            'drop',
            stashNode.atIndex,
        ]

        this.exec(stashNode.path, params, 'Stash dropped', stashNode)
    }

    /**
     * Applies changes from a file.
     */
    public applySingle = (fileNode: FileNode): void => {
        const params = [
            'checkout',
            fileNode.parent.atIndex,
            fileNode.name,
        ]

        this.exec(fileNode.parent.path, params, 'Changes from file applied', fileNode)
    }

    /**
     * Applies changes from a file.
     */
    public createSingle = (fileNode: FileNode): void => {
        const params = [
            'checkout',
            `${fileNode.parent.atIndex}^3`,
            fileNode.name,
        ]

        this.exec(fileNode.parent.path, params, 'File created', fileNode)
    }

    /**
     * Executes the git command.
     *
     * @param cwd            the current working directory
     * @param params         the array of command parameters
     * @param successMessage the string message to show on success
     * @param node           the involved node
     */
    private exec(
        cwd: string,
        params: string[],
        successMessage: string,
        node?: Node,
    ): void {
        this.stashGit.exec(params, cwd)
            .then(
                (result: string) => {
                    const issueType = this.findResultIssues(result)

                    if (issueType === 'conflict') {
                        this.logResult(params, NotificationType.Warning, result, `${successMessage} with conflicts`, node)
                    }
                    else if (issueType === 'empty') {
                        this.logResult(params, NotificationType.Message, result, 'No local changes to save', node)
                    }
                    else {
                        this.logResult(params, NotificationType.Message, result, successMessage, node)
                    }
                },
                (error: unknown) => {
                    if (error instanceof Error) {
                        const msg = error.message
                        this.logResult(params, NotificationType.Error, msg, msg, node)
                    }
                    else {
                        const msg = 'Error'
                        const excerpt = 'An unexpected error happened. See the console for more details'
                        this.logResult(params, NotificationType.Error, msg, excerpt, node)
                        console.error(error)
                    }
                },
            )
            .catch((error: unknown) => {
                if (error instanceof Error) {
                    this.logResult(params, NotificationType.Error, error.toString())
                }
                else {
                    const msg = 'Error'
                    const excerpt = 'An unexpected error happened. See the console for details'
                    this.logResult(params, NotificationType.Error, msg, excerpt, node)
                    console.error(error)
                }
            })
    }

    /**
     * Parses the result searching for possible issues / errors.
     *
     * @param result the operation result
     */
    private findResultIssues(result: string): string | null {
        for (const line of result.split('\n')) {
            if (line.startsWith('CONFLICT (content): ')) {
                return 'conflict'
            }
            if (line.startsWith('No local changes to save')) {
                return 'empty'
            }
        }

        return null
    }

    /**
     * Logs the command to the extension channel.
     *
     * @param params           the git command params
     * @param type             the message type
     * @param result           the result content
     * @param notificationText the optional notification message
     * @param node             the optional involved node
     */
    private logResult(
        params: string[],
        type: NotificationType,
        result: string,
        notificationText?: string,
        node?: Node,
    ): void {
        this.performLogging(params, result, type, node)

        this.showNotification(notificationText ?? result, type)
    }

    /**
     * Logs the command to the extension channel.
     *
     * @param params      the git command params
     * @param type        the string message type
     * @param result      the string result message
     * @param description the optional string alert description
     */
    private performLogging(
        params: string[],
        result: string,
        type: NotificationType,
        node?: Node,
    ): void {
        if (this.config.get<boolean>('log.autoclear')) {
            this.channel.clear()
        }

        const currentTime = toDateTimeIso(new Date())
        const cmd = `git ${params.join(' ')}`
        const tp = type === NotificationType.Message ? 'info' : type as string

        let msg = `${currentTime} [${tp}] > ${cmd}`

        if (node) {
            const cwd = node instanceof RepositoryNode || node instanceof StashNode
                ? node.path
                : node instanceof FileNode
                    ? node.parent.path
                    : undefined

            if (cwd) {
                msg += ` (${cwd})`
            }

            msg += ` [${this.stashLabels.getName(node)}]`
        }

        this.channel.appendLine(msg)
        this.channel.appendLine(`${result.trim()}\n\n`)
    }

    /**
     * Shows a notification with the given summary message.
     *
     * @param information the text to be displayed
     * @param type        the the message type
     */
    private showNotification(information: string, type: string) {
        const summary = information.substring(0, 300)

        const actions = [{ title: 'Show log' }]
        const callback = (value) => {
            if (typeof value !== 'undefined') {
                this.channel.show(true)
            }
        }

        if (type === 'warning') {
            void vscode.window.showWarningMessage(summary, ...actions).then(callback)
        }
        else if (type === 'error') {
            void vscode.window.showErrorMessage(summary, ...actions).then(callback)
        }
        else {
            void vscode.window.showInformationMessage(summary, ...actions).then(callback)
        }
    }
}
