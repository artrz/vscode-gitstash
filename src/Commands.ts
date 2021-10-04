'use strict'

import * as fs from 'fs'
import * as vscode from 'vscode'
import DiffDisplayer from './DiffDisplayer'
import NodeType from './StashNode/NodeType'
import { StashCommands } from './StashCommands'
import StashGit from './Git/StashGit'
import StashLabels from './StashLabels'
import StashNode from './StashNode/StashNode'
import StashNodeFactory from './StashNode/StashNodeFactory'
import WorkspaceGit from './Git/WorkspaceGit'

interface QuickPickRepositoryNodeItem extends vscode.QuickPickItem {
    node: StashNode;
}
interface QuickPickStashNodeItem extends vscode.QuickPickItem {
    node: StashNode;
}

export class Commands {
    private stashGit: StashGit
    private workspaceGit: WorkspaceGit
    private stashLabels: StashLabels
    private stashCommands: StashCommands
    private stashNodeFactory: StashNodeFactory
    private displayer: DiffDisplayer

    constructor(workspaceGit: WorkspaceGit, stashCommands: StashCommands, diffDisplayer: DiffDisplayer, stashLabels: StashLabels) {
        this.workspaceGit = workspaceGit
        this.stashCommands = stashCommands
        this.stashLabels = stashLabels
        this.displayer = diffDisplayer
        this.stashGit = new StashGit()
        this.stashNodeFactory = new StashNodeFactory()
    }

    /**
     * Creates a stash with the given resources from the scm changes list.
     *
     * @param resourceStates the list of the resources to stash
     */
    public stashSelected = (...resourceStates: vscode.SourceControlResourceState[]): void => {
        const paths = resourceStates.map(
            (resourceState: vscode.SourceControlResourceState) => resourceState.resourceUri.fsPath
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
    public show = (fileNode: StashNode): void => void this.displayer.showDiff(fileNode)

    /**
     * Shows a diff document comparing the modified stashed file and the current version.
     *
     * @param fileNode the involved node
     */
    public diffChangesCurrent = (fileNode: StashNode): void => void this.displayer.showDiffCurrent(fileNode, true, false)
    public diffCurrentChanges = (fileNode: StashNode): void => void this.displayer.showDiffCurrent(fileNode, true, true)

    /**
     * Shows a diff document comparing the stashed file parent and the current version.
     *
     * @param fileNode the involved node
     */
    public diffSourceCurrent = (fileNode: StashNode): void => void this.displayer.showDiffCurrent(fileNode, false, false)
    public diffCurrentSource = (fileNode: StashNode): void => void this.displayer.showDiffCurrent(fileNode, false, true)

    /**
     * Opens the file inside an editor.
     *
     * @param repositoryNode the node with the directory to be opened
     */
    public openFile = (fileNode?: StashNode): void => void vscode.commands
        .executeCommand<void>('vscode.open', vscode.Uri.parse(fileNode.path))

    /**
     * Opens the directory pointed by repository node.
     *
     * @param repositoryNode the node with the directory to be opened
     */
    public openDir = (repositoryNode?: StashNode): void => void vscode.env
        .openExternal(vscode.Uri.parse(repositoryNode.path))

    /**
     * Generate a stash on the active repository or selects a repository and continues.
     *
     * @param repositoryNode the involved node
     */
    public stash = (repositoryNode?: StashNode): void => {
        void this.runOnRepository(
            repositoryNode,
            (repositoryNode: StashNode) => this.stashPerform(repositoryNode),
            'Create stash'
        )
    }

    /**
     * Clears all the stashes on the active repository or selects a repository and continues.
     *
     * @param repositoryNode the involved node
     */
    public clear = (repositoryNode?: StashNode): void => {
        void this.runOnRepository(
            repositoryNode,
            (repositoryNode: StashNode) => this.clearPerform(repositoryNode),
            'Clear stashes'
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
            (stashNode: StashNode) => this.popPerform(stashNode),
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
            (stashNode: StashNode) => this.applyPerform(stashNode),
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
            (stashNode: StashNode) => this.branchPerform(stashNode),
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
            (stashNode: StashNode) => this.dropPerform(stashNode),
            'Stash drop',
        )
    }

    /**
     * Generates a stash for the given repository.
     *
     * @param repositoryNode the repository node
     */
    private stashPerform = (repositoryNode: StashNode): void => {
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
    private clearPerform = (repositoryNode: StashNode): void => {
        const repositoryLabel = this.stashLabels.getName(repositoryNode)

        vscode.window
            .showWarningMessage<vscode.MessageItem>(
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
                (e) => console.error('failure', e),
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
                    !branchName.length
                        ? void vscode.window.showErrorMessage('A branch name is required.')
                        : this.stashCommands.branch(stashNode, branchName)
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
    public applySingle = (fileNode: StashNode): void => {
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
    public createSingle = (fileNode: StashNode): void => {
        const parentLabel = this.stashLabels.getName(fileNode.parent)
        const exists = fs.existsSync(fileNode.path)

        void vscode.window
            .showWarningMessage<vscode.MessageItem>(
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
    public clipboardFromTemplate = (node: StashNode): void => {
        void vscode.env.clipboard.writeText(this.stashLabels.clipboardTemplate(node))
    }

    /**
     * Puts the stash node text on clipboard.
     *
     * @param node the involved node
     */
    public toClipboardFromObject = (node: StashNode): void => {
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
        repositoryNode: StashNode | undefined,
        callback: (stashNode: StashNode) => unknown,
        pickerPlaceholder: string
    ) => {
        if (repositoryNode) {
            return callback(repositoryNode)
        }

        const nodes: StashNode[] = (await this.workspaceGit.getRepositories())
            .map((path) => this.stashNodeFactory.createRepositoryNode(path))

        if (nodes.length === 0) {
            void vscode.window.showInformationMessage('There are no git repositories.')
            return undefined
        }

        if (nodes.length === 1) {
            return callback(nodes[0])
        }

        const editorPath = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.document.uri.fsPath
            : null

        const node = editorPath
            ? nodes.sort().reverse().find((node) => editorPath.indexOf(node.path) !== -1)
            : null

        if (node) {
            return callback(node)
        }

        const selection = await vscode.window.showQuickPick<QuickPickRepositoryNodeItem>(
            nodes.map((node) => ({ node, label: this.stashLabels.getName(node) })),
            { placeHolder: `${pickerPlaceholder} › ...`, canPickMany: false },
        )

        return selection ? callback(selection.node) : undefined
    }

    /**
     * Executes a callback on a stash.
     *
     * @param repositoryOrStashNode the involved node
     * @param callback              the callback to execute with the node
     * @param placeholder           a string to append to the placeholder as first segment
     * @param canPickMany           indicate if multi-selection will be available
     */
    private runOnStash = (
        repositoryOrStashNode: StashNode | StashNode[] | undefined,
        callback: (...x: unknown[]) => unknown,
        placeholder: string,
        canPickMany?: boolean,
    ) => {
        if (Array.isArray(repositoryOrStashNode)) {
            return repositoryOrStashNode.find((stashNode) => stashNode.type !== NodeType.Stash)
                ? vscode.window.showErrorMessage('Selection contains invalid items.')
                : callback(repositoryOrStashNode)
        }

        if (!repositoryOrStashNode || repositoryOrStashNode.type === NodeType.Repository) {
            return this.runOnRepository(
                repositoryOrStashNode,
                (repositoryNode: StashNode) => this.showStashes(repositoryNode, callback, placeholder, canPickMany || false),
                placeholder
            )
        }

        return repositoryOrStashNode.type !== NodeType.Stash
            ? vscode.window.showErrorMessage(`Invalid item ${repositoryOrStashNode.name}.`)
            : callback(repositoryOrStashNode)
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
        repositoryNode: StashNode,
        callback: (...args: unknown[]) => unknown,
        placeholder: string,
        canPickMany: boolean,
    ): Promise<unknown> | null {
        const repositoryLabel = this.stashLabels.getName(repositoryNode)

        const list = await this.stashGit.getStashes(repositoryNode.path)

        if (!list.length) {
            return vscode.window.showInformationMessage(`There are no stashed changes on ${repositoryLabel}.`)
        }

        const options = {
            placeHolder: `${placeholder} › ${repositoryLabel} › ...`,
            canPickMany,
        }

        const items: QuickPickStashNodeItem[] = list
            .map((stash) => this.stashNodeFactory.createStashNode(stash, repositoryNode))
            .map((node) => ({
                node,
                label: this.stashLabels.getName(node),
                description: this.stashLabels.getDescription(node),
            }))

        const selection: QuickPickStashNodeItem | QuickPickStashNodeItem[] = await vscode.window.showQuickPick(items, options)

        if (selection) {
            const nodeOrNodes: StashNode | StashNode[] = Array.isArray(selection)
                ? selection.map((item: QuickPickStashNodeItem) => item.node)
                : selection.node

            return callback(nodeOrNodes)
        }
    }
}
