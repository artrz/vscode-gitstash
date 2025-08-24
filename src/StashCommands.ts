/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as vscode from 'vscode'
import Config from './Config'
import FileNode from './StashNode/FileNode'
import NodeFactory from './StashNode/NodeFactory'
import RepositoryNode from './StashNode/RepositoryNode'
import StashGit from './Git/StashGit'
import StashLabels from './StashLabels'
import StashNode from './StashNode/StashNode'
import WorkspaceGit from './Git/WorkspaceGit'
import { toDateTimeIso } from './DateFormat'

enum StashType {
    Simple,
    Staged,
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
    private nodeFactory: NodeFactory
    private stashLabels: StashLabels

    constructor(config: Config, workspaceGit: WorkspaceGit, channel: vscode.OutputChannel, stashLabels: StashLabels) {
        this.config = config
        this.workspaceGit = workspaceGit
        this.channel = channel
        this.stashLabels = stashLabels
        this.stashGit = new StashGit()
        this.nodeFactory = new NodeFactory()
    }

    /**
     * Generates a stash.
     */
    public stash = (repositoryNode: RepositoryNode, type: StashType, message?: string): void => {
        const params = ['stash', 'push']

        switch (type) {
            case StashType.Staged:
                params.push('--staged')
                break
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
            params.push('--message', message)
        }

        this.exec(repositoryNode.path, params, 'Stash created', repositoryNode)
    }

    /**
     * Creates stashes for the given files across multiple repositories.
     *
     * @param filePaths an array with the list of the file paths to stash
     * @param message   an optional message to set on the stash
     */
    public push = (filePaths: string[], message?: string): void => {
        const params = ['stash', 'push', '--include-untracked']

        if (message?.length) {
            params.push('--message', message)
        }

        params.push('--')

        const paths: (string | null)[] = filePaths
        void this.workspaceGit.getRepositories().then((repositoryPaths: string[]) => {
            const repositories: Record<string, string[]> = {}
            repositoryPaths
                .sort()
                .reverse()
                .forEach((repoPath) => {
                    repositories[repoPath] = []
                    for (let i = 0; i < paths.length; i += 1) {
                        const filePath = paths[i]
                        if (filePath?.startsWith(repoPath)) {
                            repositories[repoPath].push(filePath)
                            paths[i] = null
                        }
                    }
                })

            Object.entries(repositories).forEach(([repoPath, files]) => {
                if (files.length) {
                    const repoNode = this.nodeFactory.createRepositoryNode(repoPath)
                    this.exec(repoPath, params.concat(files), 'Selected files stashed', repoNode)
                }
            })
        })
    }

    /**
     * Removes the stashes list.
     */
    public clear = (repositoryNode: RepositoryNode): void => {
        const params = ['stash', 'clear']

        this.exec(repositoryNode.path, params, 'Stash list cleared', repositoryNode)

        // TODO: Remove notes from deleted stashes
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

        // TODO: Only if pop is successful.
        // if (stashNode.note) {
        //     this.removeNote(stashNode)
        // }
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

        // TODO: Only if drop is successful.
        // if (stashNode.note) {
        //     this.removeNote(stashNode)
        // }
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
     * Sets a note in the stash.
     */
    public setNote = (stashNode: StashNode, message: string): void => {
        const params = [
            'notes',
            'add',
            '--force',
            '--message',
            message,
            stashNode.hash,
        ]

        this.exec(stashNode.path, params, 'Note set', stashNode)
    }

    /**
     * Removes any possible note from the stash.
     */
    public removeNote = (stashNode: StashNode): void => {
        const params = [
            'notes',
            'remove',
            '--ignore-missing',
            stashNode.hash,
        ]

        this.exec(stashNode.path, params, 'Note removed', stashNode)
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
        node: RepositoryNode | StashNode | FileNode,
    ): void {
        this.stashGit.exec(params, cwd)
            .then(
                (result: string) => {
                    const issueType = this.findResultIssues(result)

                    if (issueType === 'conflict') {
                        this.logResult(node, params, result, NotificationType.Warning, `${successMessage} with conflicts`)
                    }
                    else if (issueType === 'empty') {
                        this.logResult(node, params, result, NotificationType.Message, 'No local changes to save')
                    }
                    else {
                        this.logResult(node, params, result, NotificationType.Message, successMessage)
                    }
                },
                (error: unknown) => {
                    this.logError(node, params, error)
                },
            )
            .catch((error: unknown) => {
                this.logError(node, params, error)
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
     * @param node             the optional involved node
     * @param params           the git command params
     * @param result           the result content
     * @param type             the message type
     * @param notificationText the optional notification message
     */
    private logResult(
        node: RepositoryNode | StashNode | FileNode,
        params: string[],
        result: string,
        type: NotificationType,
        notificationText: string,
    ): void {
        this.performLogging(node, params, result, type)

        if (type !== NotificationType.Message || this.config.get<boolean>('notifications.success.show')) {
            this.showNotification(notificationText, type)
        }
    }

    private logError(
        node: RepositoryNode | StashNode | FileNode,
        params: string[],
        error: unknown,
    ) {
        console.error(error)
        if (error instanceof Error) {
            const result = error.message
            this.logResult(node, params, result, NotificationType.Error, result)
        }
        else {
            let result = 'Unknown error'
            try {
                result = JSON.stringify(error)
            }
            catch { /* empty */ }
            const excerpt = 'An unexpected error happened. See the console for details.'
            this.logResult(node, params, result, NotificationType.Error, excerpt)
        }
    }

    /**
     * Logs the command to the extension channel.
     *
     * @param node   the source node
     * @param params the git command params
     * @param result the string result message
     * @param type   the string message type
     */
    private performLogging(
        node: RepositoryNode | StashNode | FileNode,
        params: string[],
        result: string,
        type: NotificationType,
    ): void {
        const currentTime = toDateTimeIso(new Date())
        const cwd = node instanceof FileNode ? node.parent.path : node.path
        const cmd = `git ${params.join(' ')}`
        const tp = type === NotificationType.Message ? 'info' : type as string

        this.channel.appendLine(`${currentTime} [${tp}]`)
        this.channel.appendLine(` └ ${cwd} (${this.stashLabels.getName(node)})`)
        this.channel.appendLine(`   ${cmd}`)
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
        const callback = (value: unknown) => {
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
