/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as fs from 'fs'
import * as vscode from 'vscode'
import DiffDisplayer from './DiffDisplayer'
import FileNode from './StashNode/FileNode'
import Node from './StashNode/Node'
import NodeContainer from './StashNode/NodeContainer'
import RepositoryNode from './StashNode/RepositoryNode'
import { StashCommands } from './StashCommands'
import StashLabels from './StashLabels'
import StashNode from './StashNode/StashNode'

interface QuickPickRepositoryNodeItem extends vscode.QuickPickItem {
    node: RepositoryNode
}
interface QuickPickStashNodeItem extends vscode.QuickPickItem {
    node: StashNode
}

export class Commands {
    private nodeContainer: NodeContainer
    private stashCommands: StashCommands
    private displayer: DiffDisplayer
    private stashLabels: StashLabels

    constructor(nodeContainer: NodeContainer, stashCommands: StashCommands, diffDisplayer: DiffDisplayer, stashLabels: StashLabels) {
        this.nodeContainer = nodeContainer
        this.stashCommands = stashCommands
        this.displayer = diffDisplayer
        this.stashLabels = stashLabels
    }

    /**
     * Creates a stash with the given resources from the scm changes list.
     *
     * @param resourceStates the list of the resources to stash
     */
    public stashSelected = (...resourceStates: vscode.SourceControlResourceState[]): void => {
        const paths = resourceStates.map(
            (resourceState: vscode.SourceControlResourceState) => resourceState.resourceUri.fsPath,
        )

        void vscode.window
            .showInputBox({
                placeHolder: 'Stash message',
                prompt: 'Optionally provide a stash message',
            })
            .then((stashMessage) => {
                if (typeof stashMessage === 'string') {
                    this.stashCommands.push(paths, stashMessage)
                }
            })
    }

    /**
     * Shows a stashed file diff document.
     *
     * @param fileNode the involved node
     */
    public show = (fileNode: FileNode): void => void this.displayer.showDiff(fileNode)

    /**
     * Shows a diff document comparing the modified stashed file and the current version.
     *
     * @param fileNode the involved node
     */
    public diffChangesCurrent = (fileNode: FileNode): void => void this.displayer.showDiffCurrent(fileNode, true, false)
    public diffCurrentChanges = (fileNode: FileNode): void => void this.displayer.showDiffCurrent(fileNode, true, true)

    /**
     * Shows a diff document comparing the stashed file parent and the current version.
     *
     * @param fileNode the involved node
     */
    public diffSourceCurrent = (fileNode: FileNode): void => void this.displayer.showDiffCurrent(fileNode, false, false)
    public diffCurrentSource = (fileNode: FileNode): void => void this.displayer.showDiffCurrent(fileNode, false, true)

    /**
     * Opens the file inside an editor.
     *
     * @param repositoryNode the node with the directory to be opened
     */
    public openFile = (fileNode: FileNode): void => void vscode.commands
        .executeCommand('vscode.open', vscode.Uri.parse(fileNode.path))

    /**
     * Opens the directory pointed by repository node.
     *
     * @param repositoryNode the node with the directory to be opened
     */
    public openDir = (repositoryNode: RepositoryNode): void => void vscode.env
        .openExternal(vscode.Uri.parse(repositoryNode.path))

    /**
     * Generate a stash on the active repository or selects a repository and continues.
     *
     * @param repositoryNode the involved node
     */
    public stash = (repositoryNode?: RepositoryNode): void => {
        void this.runOnRepository(
            repositoryNode,
            (repositoryNode: RepositoryNode) => { this.stashPerform(repositoryNode) },
            'Create stash',
        )
    }

    /**
     * Clears all the stashes on the active repository or selects a repository and continues.
     *
     * @param repositoryNode the involved node
     */
    public clear = (repositoryNode?: RepositoryNode): void => {
        void this.runOnRepository(
            repositoryNode,
            (repositoryNode: RepositoryNode) => { this.clearPerform(repositoryNode) },
            'Clear stashes',
        )
    }

    /**
     * Pops the selected stash or selects one and continue.
     *
     * @param stashNode the involved node
     */
    public pop = (stashNode?: StashNode): void => {
        this.runOnStash(
            stashNode,
            (stashNode: StashNode) => { this.popPerform(stashNode) },
            'Stash pop',
        )
    }

    /**
     * Applies the selected stash or selects one and continue.
     *
     * @param stashNode the involved node
     */
    public apply = (stashNode?: StashNode): void => {
        this.runOnStash(
            stashNode,
            (stashNode: StashNode) => { this.applyPerform(stashNode) },
            'Stash apply',
        )
    }

    /**
     * Branches the selected stash or selects one and continue.
     *
     * @param stashNode the involved node
     */
    public branch = (stashNode?: StashNode): void => {
        this.runOnStash(
            stashNode,
            (stashNode: StashNode) => { this.branchPerform(stashNode) },
            'Stash branch',
        )
    }

    /**
     * Drops the currently selected stash or selects one and continue.
     *
     * @param stashNode the involved node
     */
    public drop = (stashNode?: StashNode): void => {
        this.runOnStash(
            stashNode,
            (stashNode: StashNode) => { this.dropPerform(stashNode) },
            'Stash drop',
        )
    }

    /**
     * Generates a stash for the given repository.
     *
     * @param repositoryNode the repository node
     */
    private stashPerform = (repositoryNode: RepositoryNode): void => {
        const repositoryLabel = this.stashLabels.getName(repositoryNode)

        const opts = [
            {
                label: 'Stash only',
                description: 'Create a simple stash',
                type: StashCommands.StashType.Simple,
            },
            {
                label: 'Keep index',
                description: 'Stash but keep all changes added to the index intact',
                type: StashCommands.StashType.KeepIndex,
            },
            {
                label: 'Include untracked',
                description: 'Stash also untracked files',
                type: StashCommands.StashType.IncludeUntracked,
            },
            {
                label: 'Include untracked + keep index',
                description: '',
                type: StashCommands.StashType.IncludeUntrackedKeepIndex,
            },
            {
                label: 'All',
                description: 'Stash also untracked and ignored files',
                type: StashCommands.StashType.All,
            },
            {
                label: 'All + keep index',
                description: '',
                type: StashCommands.StashType.AllKeepIndex,
            },
        ]

        void vscode.window
            .showQuickPick(opts, { placeHolder: `Create stash › ${repositoryLabel} › ...` })
            .then((option) => {
                if (typeof option !== 'undefined') {
                    void vscode.window
                        .showInputBox({
                            placeHolder: `Create stash › ${repositoryLabel} › ${option.label} › ...`,
                            prompt: 'Optionally provide a stash message',
                        })
                        .then((stashMessage) => {
                            if (typeof stashMessage === 'string') {
                                this.stashCommands.stash(repositoryNode, option.type, stashMessage)
                            }
                        })
                }
            })
    }

    /**
     * Removes the stashes on the given repository.
     *
     * @param repositoryNode the involved node
     */
    private clearPerform = (repositoryNode: RepositoryNode): void => {
        const repositoryLabel = this.stashLabels.getName(repositoryNode)

        vscode.window.showWarningMessage<vscode.MessageItem>(
            `Clear all stashes on ${repositoryLabel}?`,
            { modal: true },
            { title: 'Proceed' },
        )
            .then(
                (option) => {
                    if (typeof option !== 'undefined') {
                        this.stashCommands.clear(repositoryNode)
                    }
                },
                (e: unknown) => {
                    console.error('failure', e)
                },
            )
    }

    /**
     * Confirms and pops.
     *
     * @param stashNode the involved node
     */
    private popPerform = (stashNode: StashNode): void => {
        const stashLabel = this.stashLabels.getName(stashNode)
        const repositoryLabel = this.stashLabels.getName(stashNode.parent)

        void vscode.window.showQuickPick(
            [
                {
                    label: 'Pop only',
                    description: 'Perform a simple pop',
                    withIndex: false,
                },
                {
                    label: 'Pop and reindex',
                    description: 'Pop and reinstate the files added to index',
                    withIndex: true,
                },
            ],
            { placeHolder: `Stash pop › ${repositoryLabel} › ${stashLabel} › ...` },
        )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.pop(stashNode, option.withIndex)
                }
            })
    }

    /**
     * Confirms and applies.
     *
     * @param stashNode the involved node
     */
    private applyPerform = (stashNode: StashNode): void => {
        const stashLabel = this.stashLabels.getName(stashNode)
        const repositoryLabel = this.stashLabels.getName(stashNode.parent)

        void vscode.window.showQuickPick(
            [
                {
                    label: 'Apply only',
                    description: 'Perform a simple apply',
                    withIndex: false,
                },
                {
                    label: 'Apply and reindex',
                    description: 'Apply and reinstate the files added to index',
                    withIndex: true,
                },
            ],
            { placeHolder: `Stash apply › ${repositoryLabel} › ${stashLabel} › ...` },
        )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.apply(stashNode, option.withIndex)
                }
            })
    }

    /**
     * Branches a stash.
     *
     * @param stashNode the involved node
     */
    public branchPerform = (stashNode: StashNode): void => {
        const stashLabel = this.stashLabels.getName(stashNode)
        const repositoryLabel = this.stashLabels.getName(stashNode.parent)

        void vscode.window
            .showInputBox({
                placeHolder: `Stash apply › ${repositoryLabel} › ${stashLabel} › ...`,
                prompt: 'Write a name',
            })
            .then((branchName) => {
                if (typeof branchName === 'string') {
                    if (!branchName.length) {
                        void vscode.window.showErrorMessage('A branch name is required.')
                    }
                    else {
                        this.stashCommands.branch(stashNode, branchName)
                    }
                }
            })
    }

    /**
     * Confirms and drops.
     *
     * @param stashNode the involved node
     */
    private dropPerform = (stashNode: StashNode): void => {
        const repositoryLabel = this.stashLabels.getName(stashNode.parent)
        const stashLabel = this.stashLabels.getName(stashNode)

        void vscode.window.showWarningMessage<vscode.MessageItem>(
            `${repositoryLabel}\n\nDrop ${stashLabel}?`,
            { modal: true },
            { title: 'Proceed' },
        ).then((option) => {
            if (typeof option !== 'undefined') {
                this.stashCommands.drop(stashNode)
            }
        })
    }

    /**
     * Applies the changes on the stashed file.
     *
     * @param fileNode the involved node
     */
    public applySingle = (fileNode: FileNode): void => {
        const parentLabel = this.stashLabels.getName(fileNode.parent)

        void vscode.window.showWarningMessage<vscode.MessageItem>(
            `${parentLabel}\n\nApply changes on ${fileNode.name}?`,
            { modal: true },
            { title: 'Proceed' },
        )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.applySingle(fileNode)
                }
            })
    }

    /**
     * Applies the changes on the stashed file.
     *
     * @param fileNode the involved node
     */
    public createSingle = (fileNode: FileNode): void => {
        const parentLabel = this.stashLabels.getName(fileNode.parent)
        const exists = fs.existsSync(fileNode.path)

        void vscode.window.showWarningMessage<vscode.MessageItem>(
            `${parentLabel}\n\nCreate file ${fileNode.name}?${exists ? '\n\nThis will overwrite the current file' : ''}`,
            { modal: true },
            { title: 'Proceed' },
        )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.createSingle(fileNode)
                }
            })
    }

    /**
     * Puts the stash node text from a template to clipboard.
     *
     * @param node the involved node
     */
    public clipboardFromTemplate = (node: Node): void => {
        void vscode.env.clipboard.writeText(this.stashLabels.clipboardTemplate(node))
    }

    /**
     * Puts the stash node text on clipboard.
     *
     * @param node the involved node
     */
    public toClipboardFromObject = (node: Node): void => {
        void vscode.env.clipboard.writeText(this.stashLabels.clipboardNode(node))
    }

    /**
     * Executes a callback on a repository.
     *
     * @param repositoryNode    the involved node
     * @param callback          the callback to execute with the node
     * @param pickerPlaceholder a string to prepend in the place holder
     */
    private runOnRepository = async (
        repositoryNode: RepositoryNode | undefined,
        callback: (x: RepositoryNode) => unknown,
        pickerPlaceholder: string,
    ): Promise<void> => {
        if (repositoryNode) {
            return void callback(repositoryNode)
        }

        const nodes = await this.nodeContainer.getRepositories(false)

        if (nodes.length === 0) {
            return void vscode.window.showInformationMessage('There are no git repositories.')
        }

        if (nodes.length === 1) {
            return void callback(nodes[0])
        }

        const activeFilePath = vscode.window.activeTextEditor?.document.uri.fsPath

        repositoryNode = activeFilePath
            ? nodes.sort().reverse().find((node) => activeFilePath.includes(node.path))
            : undefined

        if (repositoryNode) {
            return void callback(repositoryNode)
        }

        const items = nodes.map((repositoryNode) => ({
            label: this.stashLabels.getName(repositoryNode),
            node: repositoryNode,
        } as QuickPickRepositoryNodeItem))

        const selection = await vscode.window.showQuickPick<QuickPickRepositoryNodeItem>(
            items,
            { placeHolder: `${pickerPlaceholder} › ...`, canPickMany: false },
        )

        if (selection) {
            callback(selection.node)
        }
    }

    /**
     * Executes a callback on a stash.
     *
     * @param stashNode   the involved node
     * @param callback    the callback to execute with the node
     * @param placeholder a string to append to the placeholder as first segment
     * @param canPickMany indicate if multi-selection will be available
     */
    private runOnStash = (
        stashNode: StashNode | undefined,
        callback: (...x: StashNode[]) => unknown,
        placeholder: string,
        canPickMany: boolean | undefined = false,
    ): void => {
        if (stashNode) {
            return void callback(stashNode)
        }

        return void this.runOnRepository(
            undefined,
            (repositoryNode: RepositoryNode) => this
                .showStashes(repositoryNode, callback, placeholder, canPickMany),
            placeholder,
        )
    }

    /**
     * List the available stashes from a repository and executes a callback on the selected one(s).
     *
     * @param repositoryNode the parent repository
     * @param callback       the callback to execute with the selected stash(es)
     * @param placeholder    a string to append to the placeholder as first segment
     * @param canPickMany    indicate if multi-selection will be available
     */
    private async showStashes(
        repositoryNode: RepositoryNode,
        callback: (...x: StashNode[]) => unknown,
        placeholder: string,
        canPickMany: boolean,
    ): Promise<void> {
        const repositoryLabel = this.stashLabels.getName(repositoryNode)

        const list = await this.nodeContainer.getStashes(repositoryNode)

        if (!list.length) {
            return void vscode.window.showInformationMessage(`There are no stashed changes on ${repositoryLabel}.`)
        }

        const options = {
            placeHolder: `${placeholder} › ${repositoryLabel} › ...`,
            canPickMany,
        }

        const items: QuickPickStashNodeItem[] = list
            .map((stashNode) => ({
                node: stashNode,
                label: this.stashLabels.getName(stashNode),
                description: this.stashLabels.getDescription(stashNode),
            }))

        const selection: QuickPickStashNodeItem | QuickPickStashNodeItem[] | undefined = await vscode.window.showQuickPick(items, options)

        if (selection) {
            const nodes = Array.isArray(selection)
                ? selection.map((item: QuickPickStashNodeItem) => item.node)
                : [selection.node]

            callback(...nodes)
        }
    }
}
