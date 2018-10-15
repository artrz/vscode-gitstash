'use string';

import * as vscode from 'vscode';
import StashGit, { StashEntry } from './StashGit';
import { StashCommands } from './StashCommands';
import StashLabels from './StashLabels';
import StashNode from './StashNode';
import StashNodeFactory from './StashNodeFactory';
import { DiffDisplayer } from './DiffDisplayer';

interface QuickPickStashNodeItem extends vscode.QuickPickItem {
    node: StashNode;
}

export class Commands {
    private stashGit: StashGit;
    private stashLabels: StashLabels;
    private stashCommands: StashCommands;
    private stashNodeFactory: StashNodeFactory;
    private displayer: DiffDisplayer;

    constructor(stashCommands: StashCommands, diffDisplayer: DiffDisplayer, stashLabels: StashLabels) {
        this.stashCommands = stashCommands;
        this.stashLabels = stashLabels;
        this.displayer = diffDisplayer;
        this.stashGit = new StashGit();
        this.stashNodeFactory = new StashNodeFactory();
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param node the involved node
     */
    public show = (node: StashNode) => {
        this.displayer.display(node);
    }

    /**
     * Shows a stashed file diff document compared with the HEAD version.
     *
     * @param node the involved node
     */
    public diffCurrent = (node: StashNode) => {
        this.displayer.diffCurrent(node);
    }

    /**
     * Applies the changes on the stashed file
     *
     * @param node the involved node
     */
    public applySingle = (node: StashNode) => {
        const label = this.stashLabels.getFileName(node);

        vscode.window
            .showWarningMessage<vscode.MessageItem>(
                `Apply changes from ${label}?`,
                { modal: true },
                { title: 'Proceed' }
            )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.applySingle(node);
                }
            });
    }

    /**
     * Generates a stash.
     */
    public stash = () => {
        this.stashGit.isStashable().then((isStashable) => {
            if (!isStashable) {
                return vscode.window.showInformationMessage('There are no changes to stash.');
            }

            vscode.window
                .showQuickPick([
                    {
                        label: 'Stash only',
                        description: 'Crate a simple stash',
                        type: StashCommands.StashType.Simple
                    },
                    {
                        label: 'Keep index',
                        description: 'Stash but keep all changes added to the index intact',
                        type: StashCommands.StashType.KeepIndex
                    },
                    {
                        label: 'Include untracked',
                        description: 'Stash also untracked files',
                        type: StashCommands.StashType.IncludeUntracked
                    },
                    {
                        label: 'Include untracked + keep index',
                        description: '',
                        type: StashCommands.StashType.IncludeUntrackedKeepIndex
                    },
                    {
                        label: 'All',
                        description: 'Stash also untracked and ignored files',
                        type: StashCommands.StashType.All
                    },
                    {
                        label: 'All + keep index',
                        description: '',
                        type: StashCommands.StashType.AllKeepIndex
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
                                    this.stashCommands.stash(option.type, stashMessage);
                                }
                            });
                    }
                });
        });
    }

    /**
     * Shows a selector to perform an apply / pop action.
     *
     * @param node the involved node
     */
    public applyOrPop = (node: StashNode) => {
        vscode.window
            .showQuickPick(
                [
                    {
                        label: 'Pop',
                        description: 'Pop the selected stash',
                        action: 'pop'
                    },
                    {
                        label: 'Apply',
                        description: 'Apply the selected stash',
                        action: 'apply'
                    }
                ],
                { placeHolder: this.stashLabels.getEntryName(node) }
            )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    if (option.action === 'pop') {
                        this.pop(node);
                    }
                    else if (option.action === 'apply') {
                        this.apply(node);
                    }
                }
            });
    }

    /**
     * Pops the selected stash or selects one to pop.
     *
     * @param node the involved node
     */
    public pop = (node?: StashNode) => {
        if (node) {
            this.popPerform(node);
            return;
        }

        this.showStashPick(
            { placeHolder: 'Pick a stash to pop' },
            (node: StashNode) => {
                this.popPerform(node);
            });
    }

    /**
     * Confirms and pops.
     *
     * @param node the involved node
     */
    private popPerform = (node: StashNode) => {
        vscode.window.showQuickPick(
            [
                {
                    label: 'Pop only',
                    description: 'Perform a simple pop',
                    withIndex: false
                },
                {
                    label: 'Pop and reindex',
                    description: 'Pop and reinstate the files added to index',
                    withIndex: true
                }
            ],
            { placeHolder: this.stashLabels.getEntryName(node) }
        )
        .then((option) => {
            if (typeof option !== 'undefined') {
                this.stashCommands.pop(node, option.withIndex);
            }
        });
    }

    /**
     * Applies the selected stash or selects one to apply.
     *
     * @param node the involved node
     */
    public apply = (node?: StashNode) => {
        if (node) {
            this.applyPerform(node);
            return;
        }

        this.showStashPick(
            { placeHolder: 'Pick a stash to apply' },
            (node: StashNode) => {
                this.applyPerform(node);
        });
    }

    /**
     * Confirms and applies.
     *
     * @param node the involved node
     */
    private applyPerform = (node: StashNode) => {
        vscode.window.showQuickPick(
            [
                {
                    label: 'Apply only',
                    description: 'Perform a simple apply',
                    withIndex: false
                },
                {
                    label: 'Apply and reindex',
                    description: 'Apply and reinstate the files added to index',
                    withIndex: true
                }
            ],
            { placeHolder: this.stashLabels.getEntryName(node) }
        )
        .then((option) => {
            if (typeof option !== 'undefined') {
                this.stashCommands.apply(node, option.withIndex);
            }
        });
    }

    /**
     * Branches a stash entry.
     */
    public branch = () => {
        this.showStashPick(
            { placeHolder: 'Pick a stash to branch' },
            (node: StashNode) => {
                vscode.window
                    .showInputBox({ placeHolder: 'Branch name' })
                    .then((branchName) => {
                        if (typeof branchName === 'string' && branchName.length > 0) {
                            this.stashCommands.branch(node, branchName);
                        }
                    });
            }
        );
    }

    /**
     * Drops the currently selected stash or selects a stash to drop.
     *
     * @param node the involved node
     */
    public drop = (node?: StashNode) => {
        if (node) {
            this.dropPerform(node);
            return;
        }

        this.showStashPick(
            { placeHolder: 'Pick a stash to drop' },
            (node: StashNode) => {
                this.dropPerform(node);
        });
    }

    /**
     * Confirms and drops.
     *
     * @param node the involved node
     */
    private dropPerform = (node: StashNode) => {
        const label = this.stashLabels.getEntryName(node);

        vscode.window
            .showWarningMessage<vscode.MessageItem>(
                `${label}\n${node.date}\n\nDrop this stash?`,
                { modal: true },
                { title: 'Proceed' }
            )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.drop(node);
                }
            });
    }

    /**
     * Removes the stash entry list.
     */
    public clear = () => {
        vscode.window
            .showWarningMessage<vscode.MessageItem>(
                'This will remove all the stash entries. Are you sure?',
                { modal: true },
                { title: 'Proceed' }
            )
            .then(
                (option) => {
                    if (typeof option !== 'undefined') {
                        this.stashCommands.clear();
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
}
