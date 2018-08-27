'use string';

import * as vscode from 'vscode';
import Config from './Config';
import StashGit from './StashGit';
import StashNode from './StashNode';

enum StashType {
    'All',
    'IncludeUntracked',
    'KeepIndex',
    'Simple'
}

export class StashCommands {
    static StashType = StashType;

    private config: Config;
    private channel: vscode.OutputChannel;
    private stashGit: StashGit;

    constructor(config: Config, channel: vscode.OutputChannel) {
        this.config = config;
        this.channel = channel;
        this.stashGit = new StashGit();
    }

    /**
     * Generates a stash.
     */
    public stash = (type: StashType, message?: string) => {
        const params = ['stash', 'save'];

        switch (type) {
            case StashType.KeepIndex:
                params.concat('--keep-index');
            case StashType.IncludeUntracked:
                params.concat('--include-untracked');
            case StashType.All:
                params.concat('--all');
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

        this.exec(params, 'Stash popped');
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

        this.exec(params, 'Stash applied');
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

        this.exec(params, 'Stash branched');
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

        this.exec(params, 'Stash dropped');
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
     */
    private exec(params: string[], successMessage: string): void {
        this.stashGit.exec(params)
            .then(
                (result) => {
                    this.showDetails('success', result, successMessage);
                },
                (error) => {
                    const excerpt = error.substring(error.indexOf(':') + 1).trim();
                    this.showDetails('error', error, excerpt);
                }
            )
            .catch((error) => {
                this.showDetails('error', error);
            });
    }

    /**
     * Shows the result message to the user.
     *
     * @param type        the string message type
     * @param message     the string result message
     * @param description the optional string alert description
     */
    private showDetails(type: string, message: string, description?: string): void {
        message = message.trim();

        const resume = description || message;
        const actions = message.length > 0
            ? [{ title: 'Show log' }]
            : [];

        if (this.config.settings.log.autoclear) {
            this.channel.clear();
        }

        if (message.length > 0) {
            this.channel.appendLine(`${message}\n`);
        }

        if (type === 'success') {
            vscode.window.showInformationMessage(resume, ...actions)
                .then((value) => {
                    if (typeof value !== 'undefined') {
                        this.channel.show(true);
                    }
                });
        }
        else {
            vscode.window.showErrorMessage(resume, ...actions)
                .then((value) => {
                    if (typeof value !== 'undefined') {
                        this.channel.show(true);
                    }
                });
        }
    }
}
