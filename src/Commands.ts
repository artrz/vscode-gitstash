'use string';

import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import * as vscode from 'vscode';
import Git from './Git';
import GitStashTreeDataProvider from './GitStashTreeDataProvider';

export class Commands {
    private git: Git;
    private channel: vscode.OutputChannel;
    private treeProvider: GitStashTreeDataProvider;
    private showExplorer;
    private config;

    constructor(channel: vscode.OutputChannel, treeProvider: GitStashTreeDataProvider) {
        this.git = new Git();
        this.treeProvider = treeProvider;
        this.channel = channel;
        this.loadConfig();
    }

    /**
     * Toggles the explorer tree.
     */
    public gitstashExplorerToggle = () => {
        this.showExplorer = typeof this.showExplorer === 'undefined'
            ? this.config.explorer.enabled
            : !this.showExplorer;

        vscode.commands.executeCommand(
            'setContext',
            'gitstash.explorer.enabled',
            this.showExplorer
        );
    }

    /**
     * Reloads the explorer tree.
     */
    public gitstashExplorerRefresh = () => {
        this.treeProvider.reload('f');
    }

    /**
     * Shows a stashed file diff document.
     */
    public gitstashShow = (model, node) => {
        if (node.index !== null) {
            model.getStashedFile(node).then(files => {
                const baseFile = this.getFile(node.name, files.base);
                const modifiedFile = this.getFile(node.name, files.modified);

                vscode.commands.executeCommand<void>(
                    'vscode.diff',
                    vscode.Uri.file(baseFile.name),
                    vscode.Uri.file(modifiedFile.name),
                    this.treeProvider.getDiffTitle(node),
                    { preview: true }
                );
            });
        } else {
            model.getUntrackedFile(node).then(content => {
                const file = this.getFile(node.name, content);

                vscode.commands.executeCommand<void>(
                    'vscode.open',
                    vscode.Uri.file(file.name)
                );
            });
        }
    }

    /**
     * Generates a stash.
     */
    public gitstashStash = () => {
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
    }

    /**
     * Pops a stash entry.
     */
    public gitstashPop = () => {
        this.showStashPick(
            { placeHolder: 'Pick a stash to pop' },
            (stash) => {
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

                            params.push(`stash@{${stash.index}}`);

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
            (stash) => {
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

                            params.push(`stash@{${stash.index}}`);

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
            (stash) => {
                vscode.window
                    .showInputBox({ placeHolder: 'Branch name' })
                    .then((branchName) => {
                        if (typeof branchName === 'string' && branchName.length > 0) {
                            const params = [
                                'stash',
                                'branch',
                                branchName,
                                `stash@{${stash.index}}`
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
            (stash) => {
                vscode.window
                    .showWarningMessage<vscode.MessageItem>(
                    `This will clear all changes on #${stash.index}. Are you sure?`,
                    { modal: true },
                    { title: 'Proceed' }
                    )
                    .then((option) => {
                        if (typeof option !== 'undefined') {
                            const params = [
                                'stash',
                                'drop',
                                `stash@{${stash.index}}`
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
     * Show a quick pick with the branches list and executes a callback on it.
     *
     * @param params   the object containing the params
     * @param callback the callback to execute
     */
    private showStashPick(params, callback) {
        this.git.getStashList().then((list) => {
            if (list.length > 0) {
                vscode.window
                    .showQuickPick(this.makeStashOptionsList(list), params)
                    .then((stash) => {
                        if (typeof stash !== 'undefined') {
                            callback(stash);
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
    private makeStashOptionsList(stashList) {
        const options = [];
        for (const stashEntry of stashList) {
            options.push({
                label: `#${stashEntry.index}:   ${stashEntry.description}`,
                index: stashEntry.index
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
    private exec(params: string[], successMessage: string) {
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
    private showDetails(type: string, message: string, description?: string) {
        message = message.trim();

        const resume = description || message;
        const button = message.length > 0
            ? { title: 'Show log' }
            : {};

        if (this.config.log.autoclear) {
            this.channel.clear();
        }

        if (message.length > 0) {
            this.channel.appendLine(`${message}\n`);
        }

        if (type === 's') {
            vscode.window.showInformationMessage(resume, button)
                .then((value) => this.channel.show(true));
        }
        else {
            vscode.window.showErrorMessage(resume, button)
                .then((value) => this.channel.show(true));
        }
    }

    /**
     * Generates a file with content.
     *
     * @param filename the string with the filename
     * @param content  the string with the content
     */
    private getFile(filename: string, content: string): any {
        const file = tmp.fileSync({ postfix: path.extname(filename) });
        fs.writeFileSync(file.name, content);

        return file;
    }

    /**
     * Loads the plugin config.
     */
    public loadConfig() {
        this.config = vscode.workspace.getConfiguration('gitstash');
    }
}
