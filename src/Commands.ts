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

    constructor(channel: vscode.OutputChannel, treeProvider: GitStashTreeDataProvider) {
        this.git = new Git();
        this.treeProvider = treeProvider;
        this.channel = channel;
    }

    /**
     * Shows a stashed file diff document.
     */
    public gitstashShow = (model, node) => {
        model.getStashedFile(node).then(result => {
            const baseFile = this.getFile(node.name, result.base);
            const modifiedFile = this.getFile(node.name, result.modified);

            vscode.commands.executeCommand<void>(
                'vscode.diff',
                vscode.Uri.file(baseFile.name),
                vscode.Uri.file(modifiedFile.name),
                this.treeProvider.getDiffTitle(node),
                { preview: true }
            );
        });
    }

    /**
     * Applies a stash entry.
     */
    public gitstashApply = () => {
        this.git.getStashList().then((list) => {
            vscode.window
                .showQuickPick(this.makeStashOptionsList(list), {
                    placeHolder: 'Pick a stash to apply'
                })
                .then((stash) => {
                    if (stash) {
                        const params = [
                            'stash',
                            'apply',
                            `stash@{${stash.index}}`
                        ];

                        this.exec(params, 'Stash applied');
                    }
                });
        });
    }

    /**
     * Drops a stash entry.
     */
    public gitstashDrop = () => {
        this.git.getStashList().then((list) => {
            vscode.window
                .showQuickPick(this.makeStashOptionsList(list), {
                    placeHolder: 'Pick a stash to drop'
                })
                .then((stash) => {
                    if (stash) {
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
                { title: 'Proceed' }
            )
            .then((option) => {
                if (option) {
                    const params = ['stash', 'clear'];

                    this.exec(params, 'Stash list cleared');
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
        if (type === 'e') {
            vscode.window.showErrorMessage(description || message.trim(), {
                title: 'Show log'
            }).then((value) => {
                if (value) {
                    this.channel.show(true);
                    this.channel.appendLine(message);
                }
            });
        }
        else {
            vscode.window.showInformationMessage(description || message.trim(), {
                title: 'Show log'
            }).then((value) => {
                if (value) {
                    this.channel.show(true);
                    this.channel.appendLine(message);
                }
            });
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
}
