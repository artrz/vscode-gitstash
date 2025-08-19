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
import FileNode from '../StashNode/FileNode'
import MessageNode from '../StashNode/MessageNode'
import Node from '../StashNode/Node'
import RepositoryNode from '../StashNode/RepositoryNode'
import StashLabels from '../StashLabels'
import StashNode from '../StashNode/StashNode'
import UriGenerator from '../UriGenerator'
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
    public getTreeItem(node: Node): TreeItem {
        if (node instanceof RepositoryNode) {
            return this.getRepositoryItem(node)
        }
        if (node instanceof StashNode) {
            return this.getStashItem(node)
        }
        if (node instanceof MessageNode) {
            return this.getMessageItem(node)
        }
        if (node instanceof FileNode) {
            return this.getFileItem(node)
        }

        throw new Error(`getTreeItem() Invalid node ${node.name}`)
    }

    /**
     * Generates an repository tree item.
     *
     * @param node the node to be used as base
     */
    private getRepositoryItem(node: RepositoryNode): TreeItem {
        return {
            id: node.id,
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
            id: node.id,
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
    private getFileItem(node: FileNode): TreeItem {
        let context = 'file'
        switch (true) {
            case (node.isAdded): context += ':added'; break
            case (node.isDeleted): context += ':deleted'; break
            case (node.isModified): context += ':modified'; break
            case (node.isRenamed): context += ':renamed'; break
            case (node.isUntracked): context += ':untracked'; break
        }

        return {
            id: node.id,
            label: this.stashLabels.getName(node),
            description: this.stashLabels.getDescription(node),
            tooltip: this.stashLabels.getTooltip(node),
            iconPath: this.getFileIcon(node),
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

    private getMessageItem(node: MessageNode): TreeItem {
        return {
            id: node.id,
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
     * @param node the node to be used as base
     */
    private getFileIcon(node: FileNode): { light: string, dark: string } | ThemeIcon {
        if (this.config.get('explorer.items.file.icons') === 'file') {
            return ThemeIcon.File
        }

        switch (true) {
            case node.isDeleted: return this.getIcon('status-deleted.svg')
            case node.isAdded: return this.getIcon('status-added.svg')
            case node.isModified: return this.getIcon('status-modified.svg')
            case node.isRenamed: return this.getIcon('status-renamed.svg')
            case node.isUntracked: return this.getIcon('status-untracked.svg')
            default: return new ThemeIcon('file-text')
        }
    }

    /**
     * Builds an icon path.
     *
     * @param filename the filename of the icon
     */
    private getIcon(filename: string): { light: string, dark: string } {
        return {
            light: join(__dirname, '..', 'resources', 'icons', 'light', 'files', this.config.get('explorer.items.file.icons'), filename),
            dark: join(__dirname, '..', 'resources', 'icons', 'dark', 'files', this.config.get('explorer.items.file.icons'), filename),
        }
    }
}
