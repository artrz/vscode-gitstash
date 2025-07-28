'use strict'

import {
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeView,
    Uri,
    commands,
    window,
} from 'vscode'
import Config from '../Config'
import GitBridge from '../GitBridge'
import NodeType from '../StashNode/NodeType'
import StashLabels from '../StashLabels'
import StashNode from '../StashNode/StashNode'
import StashNodeRepository from '../StashNode/StashNodeRepository'
import TreeItemFactory from './TreeItemFactory'
import UriGenerator from '../uriGenerator'

export default class implements TreeDataProvider<StashNode> {
    private readonly onDidChangeTreeDataEmitter = new EventEmitter<void>()
    readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event

    private config: Config
    private stashNodeRepository: StashNodeRepository
    private treeItemFactory: TreeItemFactory
    private gitBridge: GitBridge
    private rawStashes = {}
    private loadTimeout: NodeJS.Timeout | null
    private showExplorer: boolean | undefined

    constructor(
        config: Config,
        stashNodeRepository: StashNodeRepository,
        gitBridge: GitBridge,
        uriGenerator: UriGenerator,
        stashLabels: StashLabels,
    ) {
        this.config = config
        this.stashNodeRepository = stashNodeRepository
        this.gitBridge = gitBridge
        this.treeItemFactory = new TreeItemFactory(config, uriGenerator, stashLabels)
    }

    /**
     * Creates a tree view.
     */
    public createTreeView(): TreeView<StashNode> {
        const treeView = window.createTreeView('gitstash.explorer', {
            treeDataProvider: this,
            showCollapseAll: true,
            canSelectMany: false,
        })

        return treeView
    }

    /**
     * Toggles the explorer tree.
     */
    public toggle = (): void => {
        this.showExplorer = this.showExplorer === undefined
            ? this.config.get('explorer.enabled')
            : !this.showExplorer

        void commands.executeCommand(
            'setContext',
            'gitstash.explorer.enabled',
            this.showExplorer,
        )
    }

    /**
     * Reloads the explorer tree.
     */
    public refresh = (): void => {
        this.reload('force')
    }

    /**
     * Gets the tree children, which may be repositories, stashes or files.
     *
     * @param node the parent node for the requested children
     */
    public getChildren(node?: StashNode): Thenable<StashNode[]> | StashNode[] {
        if (node?.children) {
            return this.prepareChildren(node, node.children)
        }

        const children = !node
            ? this.stashNodeRepository.getRepositories(this.config.get('explorer.eagerLoadStashes'))
            : this.stashNodeRepository.getChildren(node)

        return children.then((children: StashNode[]) => {
            node?.setChildren(children)
            return this.prepareChildren(node, children)
        })
    }

    /**
     * Prepares the children to be displayed, adding default items according user settings.
     *
     * @param parent   the children's parent node
     * @param children the parent's children
     */
    private prepareChildren(parent: StashNode | null, children: StashNode[]): StashNode[] {
        const itemDisplayMode = this.config.get('explorer.itemDisplayMode')

        if (!parent) {
            if (itemDisplayMode === 'hide-empty' && this.config.get('explorer.eagerLoadStashes')) {
                children = children.filter((repositoryNode: StashNode) => repositoryNode.childrenCount)
            }
        }

        if (children.length) {
            return children
        }

        if (itemDisplayMode === 'indicate-empty') {
            if (!parent) {
                return [this.stashNodeRepository.getMessageNode('No repositories found.')]
            }
            if (parent.type === NodeType.Repository) {
                return [this.stashNodeRepository.getMessageNode('No stashes found.')]
            }
        }

        return []
    }

    /**
     * Generates a tree item for the specified node.
     *
     * @param node the node to be used as base
     */
    public getTreeItem(node: StashNode): TreeItem {
        return this.treeItemFactory.getTreeItem(node)
    }

    /**
     * Reloads the git stash tree view.
     *
     * @param type        the event type: settings, force, create, update, delete
     * @param projectPath the URI of the project with content changes
     */
    public reload(type: string, projectPath?: Uri): void {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout)
        }

        this.loadTimeout = setTimeout((type: string, pathUri?: Uri) => {
            this.loadTimeout = null
            if (['settings', 'force'].includes(type)) {
                this.onDidChangeTreeDataEmitter.fire()
            }
            else {
                const path = pathUri.fsPath

                void this.gitBridge.getRawStashesList(path).then((rawStash: null | string) => {
                    const cachedRawStash = this.rawStashes[path] as null | string

                    if (!cachedRawStash || cachedRawStash !== rawStash) {
                        this.rawStashes[path] = rawStash
                        this.onDidChangeTreeDataEmitter.fire()
                    }
                })
            }
        }, type === 'force' ? 250 : 750, type, projectPath)
    }
}
