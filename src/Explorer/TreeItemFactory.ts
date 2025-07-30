/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import {
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState,
} from 'vscode'
import Config from '../Config'
import NodeType from '../StashNode/NodeType'
import StashLabels from '../StashLabels'
import StashNode from '../StashNode/StashNode'
import UriGenerator from '../uriGenerator'
import { join } from 'path'

export default class {
    private config: Config
    private uriGenerator: UriGenerator
    private stashLabels: StashLabels

    constructor(config: Config, uriGenerator: UriGenerator, stashLabels: StashLabels) {
        this.config = config
        this.uriGenerator = uriGenerator
        this.stashLabels = stashLabels
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
            case NodeType.Message:    return this.getMessageItem(node)
            default:                  return this.getFileItem(node)
        }
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
            resourceUri: this.uriGenerator.createForTreeItem(node),
        }
    }

    /**
     * Generates an stash tree item.
     *
     * @param node the node to be used as base
     */
    private getStashItem(node: StashNode): TreeItem {
        return {
            id: `${node.type}.${node.parent.path}.${node.hash}`,
            label: this.stashLabels.getName(node),
            description: this.stashLabels.getDescription(node),
            tooltip: this.stashLabels.getTooltip(node),
            iconPath: new ThemeIcon('archive'),
            contextValue: 'stash',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            resourceUri: this.uriGenerator.createForTreeItem(node),
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
            id: `${node.type}.${node.parent.parent.path}.${node.parent.hash}.${node.name}`,
            label: this.stashLabels.getName(node),
            description: this.stashLabels.getDescription(node),
            tooltip: this.stashLabels.getTooltip(node),
            iconPath: this.getFileIcon(node.type),
            contextValue: context,
            collapsibleState: TreeItemCollapsibleState.None,
            resourceUri: this.uriGenerator.createForTreeItem(node),
            command: {
                title: 'Show stash diff',
                command: 'gitstash.show',
                arguments: [node],
            },
        }
    }

    private getMessageItem(node: StashNode): TreeItem {
        return {
            id: `${node.type}.${node.name}`,
            label: node.name,
            description: undefined,
            tooltip: undefined,
            iconPath: undefined,
            contextValue: 'message',
            collapsibleState: TreeItemCollapsibleState.None,
        }
    }

    /**
     * Builds a file icon path.
     *
     * @param filename the filename of the icon
     */
    private getFileIcon(type: NodeType): { light: string; dark: string } | ThemeIcon {
        if (this.config.get('explorer.items.file.icons') === 'file') {
            return ThemeIcon.File
        }

        switch (type) {
            case NodeType.Deleted: return this.getIcon('status-deleted.svg')
            case NodeType.IndexAdded: return this.getIcon('status-added.svg')
            case NodeType.Modified: return this.getIcon('status-modified.svg')
            case NodeType.Renamed: return this.getIcon('status-renamed.svg')
            case NodeType.Untracked: return this.getIcon('status-untracked.svg')
            default: return new ThemeIcon('file-text')
        }
    }

    /**
     * Builds an icon path.
     *
     * @param filename the filename of the icon
     */
    private getIcon(filename: string): { light: string; dark: string } {
        return {
            light: join(__dirname, '..', 'resources', 'icons', 'light', 'files', this.config.get('explorer.items.file.icons'), filename),
            dark: join(__dirname, '..', 'resources', 'icons', 'dark', 'files', this.config.get('explorer.items.file.icons'), filename),
        }
    }
}
