/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

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
import Node from '../StashNode/Node'
import NodeContainer from '../StashNode/NodeContainer'
import RepositoryNode from '../StashNode/RepositoryNode'
import StashLabels from '../StashLabels'
import StashNode from '../StashNode/StashNode'
import TreeItemFactory from './TreeItemFactory'
import UriGenerator from '../uriGenerator'

export default class implements TreeDataProvider<Node> {
    private readonly onDidChangeTreeDataEmitter = new EventEmitter<void>()
    readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event

    private config: Config
    private nodeContainer: NodeContainer
    private treeItemFactory: TreeItemFactory
    private rawStashes = {}
    private loadTimeout: NodeJS.Timeout | null
    private showExplorer: boolean | undefined

    constructor(
        config: Config,
        nodeContainer: NodeContainer,
        uriGenerator: UriGenerator,
        stashLabels: StashLabels,
    ) {
        this.config = config
        this.nodeContainer = nodeContainer
        this.treeItemFactory = new TreeItemFactory(config, uriGenerator, stashLabels)
    }

    /**
     * Creates a tree view.
     */
    public createTreeView(): TreeView<Node> {
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
     * @see TreeDataProvider.getChildren
     */
    public getChildren(node?: Node): Thenable<Node[]> | Node[] {
        if ((node instanceof RepositoryNode || node instanceof StashNode) && node.children) {
            return this.prepareChildren(node, node.children)
        }

        if (!node) {
            const eagerLoad: boolean = this.config.get('explorer.eagerLoadStashes')
            return this.nodeContainer.getRepositories(eagerLoad)
                .then((repositories) => this.prepareChildren(node, repositories))
        }

        if (node instanceof RepositoryNode) {
            return this.nodeContainer.getStashes(node).then((stashes) => {
                node.setChildren(stashes)
                return this.prepareChildren(node, stashes)
            })
        }

        if (node instanceof StashNode) {
            return this.nodeContainer.getFiles(node).then((files) => {
                node.setChildren(files)
                return this.prepareChildren(node, files)
            })
        }

        return []
    }

    /**
     * Prepares the children to be displayed, adding default items according user settings.
     *
     * @param parent   the children's parent node
     * @param children the parent's children
     */
    private prepareChildren(parent: Node | undefined, children: Node[]): Node[] {
        const itemDisplayMode = this.config.get('explorer.itemDisplayMode')

        if (!parent) {
            if (itemDisplayMode === 'hide-empty' && this.config.get('explorer.eagerLoadStashes')) {
                children = children.filter((repositoryNode: RepositoryNode) => repositoryNode.childrenCount)
            }
        }

        if (children.length) {
            return children
        }

        if (itemDisplayMode === 'indicate-empty') {
            if (!parent) {
                return [this.nodeContainer.getMessageNode('No repositories found.')]
            }
            if (parent instanceof RepositoryNode) {
                return [this.nodeContainer.getMessageNode('No stashes found.')]
            }
        }

        return []
    }

    /**
     * Generates a tree item for the specified node.
     *
     * @param node the node to be used as base
     */
    public getTreeItem(node: Node): TreeItem {
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
                return
            }

            if (pathUri) {
                const path = pathUri.fsPath

                return void this.nodeContainer.getRawStashesList(path).then((rawStash: null | string) => {
                    const cachedRawStash = this.rawStashes[path] as null | string

                    if (!cachedRawStash || cachedRawStash !== rawStash) {
                        this.rawStashes[path] = rawStash
                        this.onDidChangeTreeDataEmitter.fire()
                    }
                })
            }

            console.error(`TreeDataProvider.reload() with type '${type}' requires a defined pathUri argument`)
            throw new Error('TreeDataProvider.reload()')
        }, type === 'force' ? 250 : 750, type, projectPath)
    }
}
