'use strict'

import {
    Event,
    EventEmitter,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    commands,
} from 'vscode'
import Config from './Config'
import GitBridge from './GitBridge'
import NodeType from './StashNode/NodeType'
import RepositoryTreeBuilder from './StashNode/RepositoryTreeBuilder'
import StashLabels from './StashLabels'
import StashNode from './StashNode/StashNode'
import { join } from 'path'

export default class GitStashTreeDataProvider implements TreeDataProvider<StashNode> {
    private onDidChangeTreeDataEmitter: EventEmitter<void> = new EventEmitter<void>()
    readonly onDidChangeTreeData: Event<void> = this.onDidChangeTreeDataEmitter.event

    private config: Config
    private repositoryTreeBuilder: RepositoryTreeBuilder
    private stashLabels: StashLabels
    private gitBridge: GitBridge
    private rawStashes = {}
    private loadTimeout: NodeJS.Timer
    private showExplorer: boolean

    constructor(config: Config, repositoryTreeBuilder: RepositoryTreeBuilder, gitBridge: GitBridge, stashLabels: StashLabels) {
        this.config = config
        this.repositoryTreeBuilder = repositoryTreeBuilder
        this.gitBridge = gitBridge
        this.stashLabels = stashLabels
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
        return !node
            ? this.repositoryTreeBuilder.buildRepositoryTrees()
            : node.children
    }

    /**
     * Generates a tree item for the specified node.
     *
     * @param node the node to be used as base
     */
    public getTreeItem(node: StashNode): TreeItem {
        switch (node.type) {
            case NodeType.Repository: return this.getRepositoryItem(node)
            case NodeType.Stash:      return this.getStashItem(node)
            default:                  return this.getFileItem(node)
        }
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
            if (['settings', 'force'].indexOf(type) !== -1) {
                this.onDidChangeTreeDataEmitter.fire()
            }
            else {
                const path = pathUri.fsPath

                void this.gitBridge.getRawStashesList(path).then((rawStash: string) => {
                    const cachedRawStash = this.rawStashes[path] as string

                    if (!cachedRawStash || cachedRawStash !== rawStash) {
                        this.rawStashes[path] = rawStash
                        this.onDidChangeTreeDataEmitter.fire()
                    }
                })
            }
        }, type === 'force' ? 250 : 750, type, projectPath)
    }

    /**
     * Generates an repository tree item.
     *
     * @param node the node to be used as base
     */
    private getRepositoryItem(node: StashNode): TreeItem {
        return {
            id: `${node.type}.${node.path}`,
            label: this.stashLabels.getName(node),
            description: this.stashLabels.getDescription(node),
            tooltip: this.stashLabels.getTooltip(node),
            iconPath: new ThemeIcon('repo'),
            contextValue: 'repository',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    /**
     * Generates an stash tree item.
     *
     * @param node the node to be used as base
     */
    private getStashItem(node: StashNode): TreeItem {
        return {
            id: `${node.type}.${node.parent.path}.${node.index}`,
            label: this.stashLabels.getName(node),
            description: this.stashLabels.getDescription(node),
            tooltip: this.stashLabels.getTooltip(node),
            iconPath: new ThemeIcon('archive'),
            contextValue: 'stash',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    /**
     * Generates a stashed file tree item.
     *
     * @param node the node to be used as base
     */
    private getFileItem(node: StashNode): TreeItem {
        let context = 'file'
        switch (node.type) {
            case (NodeType.Deleted): context += ':deleted'; break
            case (NodeType.IndexAdded): context += ':indexAdded'; break
            case (NodeType.Modified): context += ':modified'; break
            case (NodeType.Renamed): context += ':renamed'; break
            case (NodeType.Untracked): context += ':untracked'; break
        }

        return {
            id: `${node.type}.${node.parent.parent.path}.${node.parent.index}.${node.name}`,
            label: this.stashLabels.getName(node),
            description: this.stashLabels.getDescription(node),
            tooltip: this.stashLabels.getTooltip(node),
            iconPath: this.getFileIcon(node.type),
            contextValue: context,
            collapsibleState: TreeItemCollapsibleState.None,
            command: {
                title: 'Show stash diff',
                command: 'gitstash.show',
                arguments: [node],
            },
        }
    }

    /**
     * Builds a file icon path.
     *
     * @param filename the filename of the icon
     */
    private getFileIcon(type: NodeType): { light: string; dark: string } | ThemeIcon {
        switch (type) {
            case NodeType.Deleted: return this.getIcon('status-deleted.svg')
            case NodeType.IndexAdded: return this.getIcon('status-added.svg')
            case NodeType.Modified: return this.getIcon('status-modified.svg')
            case NodeType.Renamed: return this.getIcon('status-renamed.svg')
            case NodeType.Untracked: return this.getIcon('status-untracked.svg')
            default: return ThemeIcon.File
        }
    }

    /**
     * Builds an icon path.
     *
     * @param filename the filename of the icon
     */
    private getIcon(filename: string): { light: string; dark: string } {
        return {
            light: join(__dirname, '..', 'resources', 'icons', 'light', filename),
            dark: join(__dirname, '..', 'resources', 'icons', 'dark', filename),
        }
    }
}
