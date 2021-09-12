'use strict'

import * as fs from 'fs'
import * as vscode from 'vscode'
import DiffDisplayer from './DiffDisplayer'
import NodeType from './StashNode/NodeType'
import { Stash } from './Git/StashGit'
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
     * Shows a stashed file diff document.
     *
     * @param fileNode the involved node
     */
    public show = (fileNode: StashNode): void => {
        void this.displayer.showDiff(fileNode)
    }

    /**
     * Shows a stashed file diff document compared with the HEAD version.
     *
     * @param fileNode the involved node
     */
    public diffCurrent = (fileNode: StashNode): void => {
        void this.displayer.showDiffCurrent(fileNode)
    }

    /**
     * Generate a stash on the active repository or selects a repository and continues.
     *
     * @param repositoryNode the involved node
     */
    public stash = (repositoryNode?: StashNode): void => {
        this.runOnRepository(
            repositoryNode,
            (repositoryNode: StashNode) => this.stashPerform(repositoryNode),
        )
    }

    /**
     * Clears all the stashes on the active repository or selects a repository and continues.
     *
     * @param repositoryNode the involved node
     */
    public clear = (repositoryNode?: StashNode): void => {
        this.runOnRepository(
            repositoryNode,
            (repositoryNode: StashNode) => this.clearPerform(repositoryNode),
        )
    }

    public openFile = (fileNode?: StashNode): void => {
        void vscode.commands.executeCommand<void>('vscode.open', vscode.Uri.parse(fileNode.path))
    }

    /**
     * Opens the directory pointed by repository node.
     *
     * @param repositoryNode the node with the directory to be opened
     */
    public openDir = (repositoryNode?: StashNode): void => {
        void vscode.env.openExternal(vscode.Uri.parse(repositoryNode.path))
    }

    /**
     * Creates a stash with the given resources.
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
                    this.stashCommands.push(this.workspaceGit, paths, stashMessage)
                }
            })
    }

    /**
     * Pops the selected stash or selects one and continue.
     *
     * @param stashNode the involved node
     */
    public pop = (stashNode?: StashNode): void => {
        this.runOnStash(
            stashNode,
            { placeHolder: 'Pick a stash to pop' },
            (stashNode: StashNode) => {
                this.popPerform(stashNode)
            },
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
            { placeHolder: 'Pick a stash to apply' },
            (stashNode: StashNode) => {
                this.applyPerform(stashNode)
            },
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
            { placeHolder: 'Pick a stash to branch' },
            (stashNode: StashNode) => {
                this.branchPerform(stashNode)
            },
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
            { placeHolder: 'Pick a stash to drop' },
            (stashNode: StashNode) => {
                this.dropPerform(stashNode)
            },
        )
    }

    /**
     * Generates a stash for the given repository.
     *
     * @param repositoryNode the repository node
     */
    private stashPerform = (repositoryNode: StashNode): void => {
        const repositoryLabel = this.stashLabels.getName(repositoryNode)

        void vscode.window
            .showQuickPick([
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
            ], { placeHolder: `${repositoryLabel}  Select actions` })
            .then((option) => {
                if (typeof option !== 'undefined') {
                    void vscode.window
                        .showInputBox({
                            placeHolder: `${repositoryLabel}  Stash message`,
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
            `Clear stashes on ${repositoryLabel}?`,
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
            { placeHolder: `${this.stashLabels.getName(stashNode)}  Select action` },
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
            { placeHolder: `${this.stashLabels.getName(stashNode)}  Select action` },
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
        void vscode.window
            .showInputBox({ placeHolder: 'Branch name' })
            .then((branchName) => {
                if (typeof branchName === 'string' && branchName.length > 0) {
                    this.stashCommands.branch(stashNode, branchName)
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

        void vscode.window
            .showWarningMessage<vscode.MessageItem>(
            `${repositoryLabel}\n\nDrop ${stashLabel}?`,
            { modal: true },
            { title: 'Proceed' },
        )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    this.stashCommands.drop(stashNode)
                }
            })
    }

    /**
     * Shows a selector to perform an apply / pop action.
     *
     * @param stashNode the involved node
     */
    public applyOrPop = (stashNode: StashNode): void => {
        const repositoryNode = this.stashNodeFactory.createRepositoryNode(stashNode.parent.path)

        void vscode.window
            .showQuickPick(
                [
                    {
                        label: 'Pop',
                        description: 'Pop the selected stash',
                        action: 'pop',
                    },
                    {
                        label: 'Apply',
                        description: 'Apply the selected stash',
                        action: 'apply',
                    },
                ],
                { placeHolder: `${this.stashLabels.getName(repositoryNode)}  ${this.stashLabels.getName(stashNode)}` },
            )
            .then((option) => {
                if (typeof option !== 'undefined') {
                    if (option.action === 'pop') {
                        this.popPerform(stashNode)
                    }
                    else if (option.action === 'apply') {
                        this.applyPerform(stashNode)
                    }
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

        void vscode.window
            .showWarningMessage<vscode.MessageItem>(
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
     * @param repositoryOrStashNode the involved node
     * @param placeHolder           the placeholder for the picker
     * @param callback              the callback to execute with the node
     */
    private runOnRepository = (repositoryOrStashNode: StashNode, callback: (stashNode: StashNode) => void): void => {
        if (repositoryOrStashNode) {
            callback(repositoryOrStashNode)
        }
        else {
            this.executeOnRepository((repositoryNode: StashNode) => {
                callback(repositoryNode)
            })
        }
    }

    /**
     * Executes a callback on a stash.
     *
     * @param repositoryOrStashNode the involved node
     * @param options               the picker options
     * @param callback              the callback to execute with the node
     */
    private runOnStash = (repositoryOrStashNode: StashNode, options: vscode.QuickPickOptions, callback: (stashNode: StashNode|StashNode[]) => void) => {
        if (repositoryOrStashNode && repositoryOrStashNode.type === NodeType.Stash) {
            callback(repositoryOrStashNode)
        }
        else if (repositoryOrStashNode && repositoryOrStashNode.type === NodeType.Repository) {
            this.showStashes(repositoryOrStashNode.path, options, callback)
        }
        else {
            this.runOnRepository(repositoryOrStashNode, (repositoryNode: StashNode) => {
                this.showStashes(repositoryNode.path, options, callback)
            })
        }
    }

    /**
     * Executes a callback on the current active repository or show a pick selector to choose a repository.
     *
     * @param callback the callback to execute
     */
    private executeOnRepository(callback) {
        const editor = vscode.window.activeTextEditor
        if (!editor) {
            this.showRepositories(callback)
            return
        }

        const editorPath = editor.document.uri.fsPath
        void this.workspaceGit.getRepositories().then((repositories) => {
            let cwd = null
            repositories.forEach((repository) => {
                if (editorPath.indexOf(repository) !== -1) {
                    cwd = repository
                    return false
                }
            })

            if (!cwd) {
                this.showRepositories(callback)
                return
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            callback(this.stashNodeFactory.createRepositoryNode(cwd))
        })
    }

    /**
     * Show a quick pick with the repositories list and executes a callback on it.
     *
     * @param callback the callback to execute
     */
    private showRepositories(callback: (stashNode: StashNode) => void) {
        const options: vscode.QuickPickOptions = {
            placeHolder: 'Select a repository',
            canPickMany: false,
        }

        void this.workspaceGit.getRepositories().then((repositories) => {
            if (repositories.length === 0) {
                void vscode.window.showInformationMessage('There are no git repositories.')
            }
            else if (repositories.length === 1) {
                callback(this.stashNodeFactory.createRepositoryNode(repositories[0]))
            }
            else {
                void vscode.window
                    .showQuickPick<QuickPickRepositoryNodeItem>(this.makeRepositoriesList(repositories), options)
                    .then((selection) => {
                        if (typeof selection !== 'undefined') {
                            callback(selection.node)
                        }
                    })
            }
        })
    }

    /**
     * Gets the stashes list for the given current working directory.
     *
     * @param cwd      the current working directory
     * @param options  the object containing the quick pick options
     * @param callback the callback to execute
     */
    private showStashes(cwd: string, options: vscode.QuickPickOptions, callback) {
        const repositoryNode = this.stashNodeFactory.createRepositoryNode(cwd)
        const repositoryLabel = this.stashLabels.getName(repositoryNode)
        options.placeHolder = `${repositoryLabel}  ${options.placeHolder}`

        void this.stashGit.getStashes(cwd).then((list) => {
            if (list.length > 0) {
                void vscode.window
                    .showQuickPick<QuickPickStashNodeItem>(this.makeStashOptionsList(repositoryNode, list), options)
                    .then((selection) => {
                        if (typeof selection !== 'undefined') {
                            let nodeOrNodes: StashNode | StashNode[] = null

                            if (Array.isArray(selection)) {
                                const nodes: StashNode[] = []
                                selection.forEach((value: QuickPickStashNodeItem) => nodes.push(value.node))
                                nodeOrNodes = nodes
                            }
                            else {
                                nodeOrNodes = selection.node
                            }

                            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                            callback(nodeOrNodes)
                        }
                    })
            }
            else {
                void vscode.window.showInformationMessage(`There are no stashed changes on ${repositoryLabel}.`)
            }
        })
    }

    /**
     * Generates a an options list with the existent repositories.
     *
     * @param repositories an array of repository paths
     */
    private makeRepositoriesList(repositories: string[]): QuickPickRepositoryNodeItem[] {
        const options: QuickPickRepositoryNodeItem[] = []

        for (const repositoryPath of repositories) {
            const node = this.stashNodeFactory.createRepositoryNode(repositoryPath)

            const option: QuickPickRepositoryNodeItem = {
                label: this.stashLabels.getName(node),
                node: node,
            }

            options.push(option)
        }

        return options
    }

    /**
     * Generates an options list with the stashes.
     *
     * @param repositoryNode the repository node to use as base
     * @param stashes        an array of Stash objects
     */
    private makeStashOptionsList(repositoryNode: StashNode, stashList: Stash[]): QuickPickStashNodeItem[] {
        const options: QuickPickStashNodeItem[] = []

        for (const stash of stashList) {
            const node = this.stashNodeFactory.createStashNode(stash, repositoryNode)

            options.push({
                label: this.stashLabels.getName(node),
                node: node,
            })
        }

        return options
    }
}
