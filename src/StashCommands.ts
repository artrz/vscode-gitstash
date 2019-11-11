'use string';

import * as vscode from 'vscode';
import Config from './Config';
import StashGit from './Git/StashGit';
import StashLabels from './StashLabels';
import StashNode from './StashNode/StashNode';

enum StashType {
    'Simple',
    'KeepIndex',
    'IncludeUntracked',
    'IncludeUntrackedKeepIndex',
    'All',
    'AllKeepIndex',
}

export class StashCommands {
    static StashType = StashType;

    private config: Config;
    private channel: vscode.OutputChannel;
    private stashGit: StashGit;
    private stashLabels: StashLabels;

    constructor(config: Config, channel: vscode.OutputChannel, stashLabels: StashLabels) {
        this.config = config;
        this.channel = channel;
        this.stashLabels = stashLabels;
        this.stashGit = new StashGit();
    }

    /**
     * Generates a stash.
     */
    public stash = (repositoryNode: StashNode, type: StashType, message?: string) => {
        const params = ['stash', 'save'];

        switch (type) {
            case StashType.KeepIndex:
                params.push('--keep-index');
                break;
            case StashType.IncludeUntracked:
                params.push('--include-untracked');
                break;
            case StashType.IncludeUntrackedKeepIndex:
                params.push('--include-untracked');
                params.push('--keep-index');
                break;
            case StashType.All:
                params.push('--all');
                break;
            case StashType.AllKeepIndex:
                params.push('--all');
                params.push('--keep-index');
            break;
        }

        if (message.length > 0) {
            params.push(message);
        }

        this.exec(repositoryNode.path, params, 'Stash created', repositoryNode);
    }

    /**
     * Removes the stashes list.
     */
    public clear = (repositoryNode: StashNode) => {
        const params = ['stash', 'clear'];

        this.exec(repositoryNode.path, params, 'Stash list cleared', repositoryNode);
    }

    /**
     * Pops a stash.
     */
    public pop = (stashNode: StashNode, withIndex: boolean) => {
        const params = ['stash', 'pop'];

        if (withIndex) {
            params.push('--index');
        }

        params.push(`stash@{${stashNode.index}}`);

        this.exec(stashNode.path, params, 'Stash popped', stashNode);
    }

    /**
     * Applies a stash.
     */
    public apply = (stashNode: StashNode, withIndex: boolean) => {
        const params = ['stash', 'apply'];

        if (withIndex) {
            params.push('--index');
        }

        params.push(`stash@{${stashNode.index}}`);

        this.exec(stashNode.path, params, 'Stash applied', stashNode);
    }

    /**
     * Branches a stash.
     */
    public branch = (stashNode: StashNode, name: string) => {
        const params = [
            'stash',
            'branch',
            name,
            `stash@{${stashNode.index}}`,
        ];

        this.exec(stashNode.path, params, 'Stash branched', stashNode);
    }

    /**
     * Drops a stash.
     */
    public drop = (stashNode: StashNode) => {
        const params = [
            'stash',
            'drop',
            `stash@{${stashNode.index}}`,
        ];

        this.exec(stashNode.path, params, 'Stash dropped', stashNode);
    }

    /**
     * Applies changes from a file.
     */
    public applySingle = (fileNode: StashNode) => {
        const params = [
            'checkout',
            `stash@{${fileNode.parent.index}}`,
            fileNode.name,
        ];

        this.exec(fileNode.parent.path, params, 'Changes from file applied', fileNode);
    }

    /**
     * Applies changes from a file.
     */
    public createSingle = (fileNode: StashNode) => {
        const params = [
            'checkout',
            `stash@{${fileNode.parent.index}}^3`,
            fileNode.name,
        ];

        this.exec(fileNode.parent.path, params, 'File created', fileNode);
    }

    /**
     * Executes the git command.
     *
     * @param cwd            the current working directory
     * @param params         the array of command parameters
     * @param successMessage the string message to show on success
     * @param node           the involved node
     */
    private exec(cwd: string, params: string[], successMessage: string, node?: StashNode): void {
        this.stashGit.exec(params, cwd)
            .then(
                (result: string) => {
                    const issueType = this.findResultIssues(result);

                    if (issueType === 'conflict') {
                        this.logResult(params, 'warning', result, `${successMessage} with conflicts`, node);
                    }
                    else if (issueType === 'empty') {
                        this.logResult(params, 'message', result, 'No local changes to save', node);
                    }
                    else {
                        this.logResult(params, 'message', result, successMessage, node);
                    }
                },
                (error) => {
                    const excerpt = error.substring(error.indexOf(':') + 1).trim();
                    this.logResult(params, 'error', error, excerpt, node);
                },
            )
            .catch((error) => {
                this.logResult(params, 'error', error.toString());
            });
    }

    /**
     * Parses the result searching for possible issues / errors.
     *
     * @param result the operation result
     */
    private findResultIssues(result: string): string|null {
        for (const line of result.split('\n')) {
            if (line.startsWith('CONFLICT (content): ')) {
                return 'conflict';
            }
            if (line.startsWith('No local changes to save')) {
                return 'empty';
            }
        }

        return null;
    }

    /**
     * Logs the command to the extension channel.
     *
     * @param params           the git command params
     * @param type             the message type
     * @param result           the result content
     * @param notificationText the optional notification message
     */
    private logResult(params: string[], type: string, result: string, notificationText?: string, node?: StashNode): void {
        this.prepareLogChannel();

        this.performLogging(params, result, node);

        this.showNotification(notificationText || result, type);
    }

    /**
     * Prepares the log channel to before using it.
     */
    private prepareLogChannel() {
        if (this.config.settings.log.autoclear) {
            this.channel.clear();
        }

        const currentTime = new Date();
        this.channel.appendLine(`> ${currentTime.toLocaleString()}`);
    }

    /**
     * Logs the command to the extension channel.
     *
     * @param params      the git command params
     * @param type        the string message type
     * @param result      the string result message
     * @param description the optional string alert description
     */
    private performLogging(params: string[], result: string, node?: StashNode) {
        if (node) {
            const cwd = node.isFile ? node.parent.path : node.path;
            this.channel.appendLine(cwd
                ? `  ${cwd} - ${this.stashLabels.getName(node)}`
                : `  ${this.stashLabels.getName(node)}`,
            );
        }

        this.channel.appendLine(`  git ${params.join(' ')}`);
        this.channel.appendLine(`${result.trim()}\n`);
    }

    /**
     * Shows a notification with the given summary message.
     *
     * @param information the text to be displayed
     * @param type        the the message type
     */
    private showNotification(information: string, type: string) {
        const summary = information.substr(0, 300);

        const actions = [{ title: 'Show log' }];
        const callback = (value) => {
            if (typeof value !== 'undefined') {
                this.channel.show(true);
            }
        };

        if (type === 'warning') {
            vscode.window.showWarningMessage(summary, ...actions).then(callback);
        }
        else if (type === 'error') {
            vscode.window.showErrorMessage(summary, ...actions).then(callback);
        }
        else {
            vscode.window.showInformationMessage(summary, ...actions).then(callback);
        }
    }
}
