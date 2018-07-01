'use string';

import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import Config from './Config';
import StashGit, { StashEntry } from './StashGit';
import Model from './Model';
import StashLabels from './StashLabels';
import StashNode, { NodeType } from './StashNode';
import StashNodeFactory from './StashNodeFactory';

interface QuickPickStashNodeItem extends vscode.QuickPickItem {
    node: StashNode;
}

export class Commands {
    private config: Config;
    private stashLabels: StashLabels;
    private channel: vscode.OutputChannel;
    private git: StashGit;
    private stashNodeFactory: StashNodeFactory;

    constructor(config: Config, stashLabels: StashLabels, channel: vscode.OutputChannel) {
        this.config = config;
        this.stashLabels = stashLabels;
        this.channel = channel;

        this.git = new StashGit();
        this.stashNodeFactory = new StashNodeFactory();

        tmp.setGracefulCleanup();
    }

    /**
     * Shows a stashed file diff document.
     */
    public gitstashShow = (model: Model, node: StashNode) => {
        if (node.type === NodeType.Modified) {
            model.getStashedFile(node).then((files) => {
                const originalFile = this.createTmpFile(node.name, files.base, 'binary');
                const modifiedFile = this.createTmpFile(node.name, files.modified, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }

        else if (node.type === NodeType.Untracked) {
            model.getUntrackedFile(node).then((content) => {
                const originalFile = this.createTmpFile(node.name, null, 'binary');
                const modifiedFile = this.createTmpFile(node.name, content, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }

        else if (node.type === NodeType.IndexedUntracked) {
            model.getIndexedUntrackedFile(node).then((content) => {
                const originalFile = this.createTmpFile(node.name, null, 'binary');
                const modifiedFile = this.createTmpFile(node.name, content, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }

        else if (node.type === NodeType.Deleted) {
            model.getDeletedFile(node).then((content) => {
                const originalFile = this.createTmpFile(node.name, content, 'binary');
                const modifiedFile = this.createTmpFile(node.name, null, 'binary');

                this.showDiff(node, originalFile, modifiedFile);
            });
        }
    }

    /**
     * Generates a stash.
     */
    public gitstashStash = () => {
        this.git.isStashable().then((isStashable) => {
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
                (e) => console.log('failure', e)
            );
    }

    /**
     * Shows the diff view with the specified files.
     *
     * @param node         the stash node that's being displayed
     * @param originalFile the contents of the file prior the modification
     * @param modifiedFile the contents of the file after the modification
     */
    private showDiff(node: StashNode, originalFile: tmp.SynchrounousResult, modifiedFile: tmp.SynchrounousResult) {
        vscode.commands.executeCommand<void>(
            'vscode.diff',
            vscode.Uri.file(originalFile.name),
            vscode.Uri.file(modifiedFile.name),
            this.stashLabels.getDiffTitle(node),
            { preview: true }
        );
    }

    /**
     * Show a quick pick with the branches list and executes a callback on it.
     *
     * @param params   the object containing the params
     * @param callback the callback to execute
     */
    private showStashPick(params, callback) {
        this.git.getStashList().then((list) => {
            if (list.length > 0) {
                vscode.window
                    .showQuickPick<QuickPickStashNodeItem>(this.makeStashOptionsList(list), params)
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
        this.git.exec(params)
            .then(
                (result) => {
                    this.showDetails('s', result, successMessage);
                },
                (error) => {
                    const excerpt = error.substring(error.indexOf(':') + 1).trim();
                    this.showDetails('e', error, excerpt);
                }
            )
            .catch((error) => {
                this.showDetails('e', error);
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
        const action = message.length > 0
            ? ['Show log']
            : [];

        if (this.config.settings.log.autoclear) {
            this.channel.clear();
        }

        if (message.length > 0) {
            this.channel.appendLine(`${message}\n`);
        }

        if (type === 's') {
            vscode.window.showInformationMessage(resume, ...action)
                .then((value) => {
                    if (typeof value !== 'undefined') {
                        this.channel.show(true);
                    }
                });
        }
        else {
            vscode.window.showErrorMessage(resume, ...action)
                .then((value) => {
                    if (typeof value !== 'undefined') {
                        this.channel.show(true);
                    }
                });
        }
    }

    /**
     * Generates a file with content.
     *
     * @param filename the string with the filename
     * @param content  the string with the content
     * @param encoding the string with the optional encoding to replace utf8
     */
    private createTmpFile(filename: string, content?: string, encoding?: string): tmp.SynchrounousResult {
        const file = tmp.fileSync({
            prefix: 'vscode-gitstash-',
            postfix: path.extname(filename)
        });

        if (content !== null) {
            fs.writeFileSync(file.name, content, encoding || 'utf8');
        }

        return file;
    }
}
