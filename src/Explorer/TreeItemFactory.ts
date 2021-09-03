'use strict'

import {
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState,
} from 'vscode'
import NodeType from '../StashNode/NodeType'
import StashLabels from '../StashLabels'
import StashNode from '../StashNode/StashNode'
import { join } from 'path'

export default class {
    private stashLabels: StashLabels

    constructor(stashLabels: StashLabels) {
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
            // TODO: config
            light: join(__dirname, '..', 'resources', 'icons', 'light', filename),
            dark: join(__dirname, '..', 'resources', 'icons', 'dark', filename),
        }
    }
}
