'use string';

import * as vscode from 'vscode';
import Config from './Config';
import StashGit from './StashGit';
import StashLabels from './StashLabels';
import StashNode from './StashNode';

enum StashType {
    'Simple',
    'KeepIndex',
    'IncludeUntracked',
    'IncludeUntrackedKeepIndex',
    'All',
    'AllKeepIndex'
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
    public stash = (type: StashType, message?: string) => {
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
            case StashType.AllKeepIndex:
                params.push('--all');
                params.push('--keep-index');
            break;
        }

        if (message.length > 0) {
            params.push(message);
        }

        this.exec(params, 'Stash created');
    }

    /**
     * Pops a stash entry.
     */
    public pop = (node: StashNode, withIndex: boolean) => {
        const params = ['stash', 'pop'];

        if (withIndex) {
            params.push('--index');
        }

        params.push(`stash@{${node.index}}`);

        this.exec(params, 'Stash popped', node);
    }

    /**
     * Applies a stash entry.
     */
    public apply = (node: StashNode, withIndex: boolean) => {
        const params = ['stash', 'apply'];

        if (withIndex) {
            params.push('--index');
        }

        params.push(`stash@{${node.index}}`);

        this.exec(params, 'Stash applied', node);
    }

    /**
     * Branches a stash entry.
     */
    public branch = (node: StashNode, name: string) => {
        const params = [
            'stash',
            'branch',
            name,
            `stash@{${node.index}}`
        ];

        this.exec(params, 'Stash branched', node);
    }

    /**
     * Drops a stash entry.
     */
    public drop = (node: StashNode) => {
        const params = [
            'stash',
            'drop',
            `stash@{${node.index}}`
        ];

        this.exec(params, 'Stash dropped', node);
    }

    /**
     * Removes the stash entry list.
     */
    public clear = () => {
        const params = ['stash', 'clear'];

        this.exec(params, 'Stash list cleared');
    }

    /**
     * Executes the git command.
     *
     * @param params         the array of command parameters
     * @param successMessage the string message to show on success
     * @param node           the involved node
     */
    private exec(params: string[], successMessage: string, node?: StashNode): void {
        this.stashGit.exec(params)
            .then(
                (result) => {
                    let hasConflict = false;
                    for (const line of result.split('\n')) {
                        if (line.startsWith('CONFLICT (content): ')) {
                            hasConflict = true;
                            break;
                        }
                    }
                    if (!hasConflict) {
                        this.showDetails(params, 'success', result, successMessage, node);
                    }
                    else {
                        this.showDetails(params, 'warning', result, `${successMessage} with conflicts`, node);
                    }
                },
                (error) => {
                    const excerpt = error.substring(error.indexOf(':') + 1).trim();
                    this.showDetails(params, 'error', error, excerpt, node);
                }
            )
            .catch((error) => {
                this.showDetails(params, 'error', error);
            });
    }

    /**
     * Shows the result message to the user.
     *
     * @param params      the git command params
     * @param type        the string message type
     * @param message     the string result message
     * @param description the optional string alert description
     */
    private showDetails(params: string[], type: string, message: string, description?: string, node?: StashNode): void {
        message = message.trim();

        if (this.config.settings.log.autoclear) {
            this.channel.clear();
        }

        if (message.length > 0) {
            const currentTime = new Date();
            this.channel.append(`> ${currentTime}`);
            if (node) {
                this.channel.append(`: ${this.stashLabels.getEntryName(node)}`);
            }
            this.channel.appendLine('');
            this.channel.appendLine(`  git ${params.join(' ')}`);
            this.channel.appendLine(`${message}\n`);
        }

        const resume = (description || message).substr(0, 300);
        const actions = message.length > 0 ? [{ title: 'Show log' }] : [];
        const callback = (value) => {
            if (typeof value !== 'undefined') {
                this.channel.show(true);
            }
        };

        if (type === 'success') {
            vscode.window.showInformationMessage(resume, ...actions).then(callback);
        }
        else if (type === 'warning') {
            vscode.window.showWarningMessage(resume, ...actions).then(callback);
        }
        else {
            vscode.window.showErrorMessage(resume, ...actions).then(callback);
        }
    }
}
