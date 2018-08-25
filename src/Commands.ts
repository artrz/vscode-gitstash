'use string';

import * as vscode from 'vscode';
import Config from './Config';
import Model from './Model';
import StashGit, { StashEntry } from './StashGit';
import StashLabels from './StashLabels';
import StashNode from './StashNode';
import StashNodeFactory from './StashNodeFactory';
import { DiffDisplayer } from './DiffDisplayer';

interface QuickPickStashNodeItem extends vscode.QuickPickItem {
    node: StashNode;
}

export class Commands {
    private config: Config;
    private stashLabels: StashLabels;
    private channel: vscode.OutputChannel;
    private stashGit: StashGit;
    private stashNodeFactory: StashNodeFactory;
    private displayer: DiffDisplayer;

    constructor(config: Config, stashLabels: StashLabels, channel: vscode.OutputChannel) {
        this.config = config;
        this.stashLabels = stashLabels;
        this.channel = channel;

        this.stashGit = new StashGit();
        this.stashNodeFactory = new StashNodeFactory();
        this.displayer = new DiffDisplayer(this.stashLabels);
    }

    /**
     * Shows a stashed file diff document.
     */
    public gitstashShow = (model: Model, node: StashNode) => {
        this.displayer.display(model, node);
    }

    /**
     * Generates a stash.
     */
    public gitstashStash = () => {
        this.stashGit.isStashable().then((isStashable) => {
            if (!isStashable) {
                return vscode.window.showInformationMessage('There are no changes to stash.');
            }

            vscode.window
                .showQuickPick([
                    {
                        label: 'Stash only',
                        description: 'Crate a simple stash',
                        param: null
                    },
                    {
                        label: 'Keep index',
                        description: 'Stash but keep all changes added to the index intact',
                        param: '--keep-index'
                    },
                    {
                        label: 'Include untracked',
                        description: 'Stash also untracked files',
                        param: '--include-untracked'
                    },
                    {
                        label: 'All',
                        description: 'Stash also untracked and ignored files',
                        param: '--all'
                    }
                ])
                .then((option) => {
                    if (typeof option !== 'undefined') {
                        vscode.window
                            .showInputBox({
                                placeHolder: 'Stash message',
                                prompt: 'Optionally provide a stash message'
                            })
                            .then((stashMessage) => {
                                if (typeof stashMessage === 'string') {
                                    const params = ['stash', 'save'];

                                    if (typeof option.param === 'string') {
                                        params.push(option.param);
                                    }

                                    if (stashMessage.length > 0) {
                                        params.push(stashMessage);
                                    }

                                    this.exec(params, 'Stash created');
                                }
                            });
                    }
                });
        });
    }

    /**
     * Pops a stash entry.
     */
    public gitstashPop = () => {
        this.showStashPick(
            { placeHolder: 'Pick a stash to pop' },
            (node: StashNode) => {
                vscode.window
                    .showQuickPick([
                        {
                            label: 'Pop only',
                            description: 'Perform a simple pop',
                            param: null
                        },
                        {
                            label: 'Pop and reindex',
                            description: 'Pop and reinstate the files added to index',
                            param: '--index'
                        }
                    ])
                    .then((option) => {
                        if (typeof option !== 'undefined') {
                            const params = ['stash', 'pop'];

                            if (option.param !== null) {
                                params.push(option.param);
                            }

                            params.push(`stash@{${node.index}}`);

                            this.exec(params, 'Stash popped');
                        }
                    });
        });
    }

    /**
     * Applies a stash entry.
     */
    public gitstashApply = () => {
        this.showStashPick(
            { placeHolder: 'Pick a stash to apply' },
            (node: StashNode) => {
                vscode.window
                    .showQuickPick([
                        {
                            label: 'Apply only',
                            description: 'Perform a simple apply',
                            param: null
                        },
                        {
                            label: 'Apply and reindex',
                            description: 'Apply and reinstate the files added to index',
                            param: '--index'
                        }
                    ])
                    .then((option) => {
                        if (typeof option !== 'undefined') {
                            const params = ['stash', 'apply'];

                            if (option.param !== null) {
                                params.push(option.param);
                            }

                            params.push(`stash@{${node.index}}`);

                            this.exec(params, 'Stash applied');
                        }
                    });
        });
    }

    /**
     * Branches a stash entry.
     */
    public gitstashBranch = () => {
        this.showStashPick(
            { placeHolder: 'Pick a stash to branch' },
            (node: StashNode) => {
                vscode.window
                    .showInputBox({ placeHolder: 'Branch name' })
                    .then((branchName) => {
                        if (typeof branchName === 'string' && branchName.length > 0) {
                            const params = [
                                'stash',
                                'branch',
                                branchName,
                                `stash@{${node.index}}`
                            ];

                            this.exec(params, 'Stash branched');
                        }
                    });
            }
        );
    }

    /**
     * Drops a stash entry.
     */
    public gitstashDrop = () => {
        this.showStashPick(
            { placeHolder: 'Pick a stash to drop' },
            (node: StashNode) => {
                const label = this.stashLabels.getEntryName(node);

                vscode.window
                    .showWarningMessage<vscode.MessageItem>(
                        `This will clear all changes on\n\n${label}\n\nAre you sure?`,
                        { modal: true },
                        { title: 'Proceed' }
                    )
                    .then((option) => {
                        if (typeof option !== 'undefined') {
                            const params = [
                                'stash',
                                'drop',
                                `stash@{${node.index}}`
                            ];

                            this.exec(params, 'Stash dropped');
                        }
                    });
        });
    }

    /**
     * Removes the stash entry list.
     */
    public gitstashClear = () => {
        vscode.window
            .showWarningMessage<vscode.MessageItem>(
                'This will remove all the stash entries. Are you sure?',
                { modal: true },
                { title: 'Proceed' }
            )
            .then(
                (option) => {
                    if (typeof option !== 'undefined') {
                        const params = ['stash', 'clear'];

                        this.exec(params, 'Stash list cleared');
                    }
                },
                (e) => console.error('failure', e)
            );
    }

    /**
     * Show a quick pick with the branches list and executes a callback on it.
     *
     * @param options  the object containing the quick pick options
     * @param callback the callback to execute
     */
    private showStashPick(options: vscode.QuickPickOptions, callback) {
        options.canPickMany = false;
        this.stashGit.getStashList().then((list) => {
            if (list.length > 0) {
                vscode.window
                    .showQuickPick<QuickPickStashNodeItem>(this.makeStashOptionsList(list), options)
                    .then((selection) => {
                        if (typeof selection !== 'undefined') {
                            callback(selection.node);
                        }
                    });
            }
            else {
                vscode.window.showInformationMessage('There are no stashed changes.');
            }
        });
    }

    /**
     * Generates a an options list with the stash entries.
     *
     * @param stashList an array of StashEntry objects
     */
    private makeStashOptionsList(stashList: StashEntry[]): QuickPickStashNodeItem[] {
        const options = [];

        for (const stashEntry of stashList) {
            const node = this.stashNodeFactory.entryToNode(stashEntry);

            options.push({
                label: this.stashLabels.getEntryName(node),
                node: node
            });
        }

        return options;
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
