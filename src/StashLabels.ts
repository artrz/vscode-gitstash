/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as DateFormat from './DateFormat'
import * as path from 'path'
import Config from './Config'
import FileNode from './StashNode/FileNode'
import Node from './StashNode/Node'
import RepositoryNode from './StashNode/RepositoryNode'
import StashNode from './StashNode/StashNode'
import MessageNode from './StashNode/MessageNode'

export default class {
    private config: Config

    constructor(config: Config) {
        this.config = config
    }

    /**
     * Generates a node label.
     *
     * @param node The node to be used as base
     */
    public getName(node: Node): string {
        return this.getContent(node, 'label')
    }

    /**
     * Generates a node description.
     *
     * @param node The node to be used as base
     */
    public getDescription(node: Node): string {
        return this.getContent(node, 'description')
    }

    /**
     * Generates a node tooltip.
     *
     * @param node The node to be used as base
     */
    public getTooltip(node: Node): string {
        return this.getContent(node, 'tooltip')
    }

    /**
     * Generates clipboard text for the stash node.
     *
     * @param stashNode The node to be used as base
     */
    public clipboardTemplate(node: Node): string {
        return this.getContent(node, 'to-clipboard')
    }

    /**
     * Generates clipboard text for the node.
     *
     * @param node The node to be used as base
     */
    public clipboardNode(node: Node): string {
        if (node instanceof RepositoryNode) {
            return node.path
        }
        if (node instanceof StashNode) {
            return node.name
        }
        if (node instanceof FileNode) {
            return node.path
        }

        return node.id
    }

    /**
     * Generates a node label.
     *
     * @param node The node to be used as base
     * @param property The string with the property prefix for setting keys
     */
    private getContent(node: Node, property: string): string {
        if (node instanceof RepositoryNode) {
            const prop = (() => {
                switch (property) {
                    case 'label': return this.config.key.expItemsRepoLabel
                    case 'description': return this.config.key.expItemsRepoDescription
                    case 'tooltip': return this.config.key.expItemsRepoTooltip
                    case 'to-clipboard': return this.config.key.expItemsRepoToClipboard
                }
                throw new Error('Invalid property')
            })()
            return this.parseRepositoryLabel(node, this.config.get<string>(prop))
        }

        if (node instanceof StashNode) {
            const prop = (() => {
                switch (property) {
                    case 'label': return this.config.key.expItemsStashLabel
                    case 'description': return this.config.key.expItemsStashDescription
                    case 'tooltip': return this.config.key.expItemsStashTooltip
                    case 'to-clipboard': return this.config.key.expItemsStashToClipboard
                }
                throw new Error('Invalid property')
            })()
            return this.parseStashLabel(node, this.config.get<string>(prop))
        }

        if (node instanceof FileNode) {
            if (node.isAdded || node.isDeleted || node.isModified || node.isUntracked) {
                const prop = (() => {
                    switch (property) {
                        case 'label': return this.config.key.expItemsFileLabel
                        case 'description': return this.config.key.expItemsFileDescription
                        case 'tooltip': return this.config.key.expItemsFileTooltip
                        case 'to-clipboard': return this.config.key.expItemsFileToClipboard
                    }
                    throw new Error('Invalid property')
                })()
                return this.parseFileLabel(node, this.config.get<string>(prop))
            }

            if (node.isRenamed) {
                const prop = (() => {
                    switch (property) {
                        case 'label': return this.config.key.expItemsRenamedFileLabel
                        case 'description': return this.config.key.expItemsRenamedFileDescription
                        case 'tooltip': return this.config.key.expItemsRenamedFileTooltip
                        case 'to-clipboard': return this.config.key.expItemsRenamedFileToClipboard
                    }
                    throw new Error('Invalid property')
                })()
                return this.parseFileLabel(node, this.config.get<string>(prop))
            }
        }

        if (node instanceof MessageNode) {
            return node.name
        }

        throw new Error(`getContent(): Unsupported Node: ${node.name}`)
    }

    /**
     * Generates a repository label.
     *
     * @param repositoryNode The node to be used as base
     */
    private parseRepositoryLabel(repositoryNode: RepositoryNode, template: string): string {
        return template
            .replace('${path}', `${path.dirname(repositoryNode.path)}/`)
            .replace('${directory}', path.basename(repositoryNode.path))
            .replace('${name}', repositoryNode.name)
            .replace('${stashesCount}', this.getChildrenCount(repositoryNode))
    }

    /**
     * Generates a stash item label.
     *
     * @param stashNode The node to be used as base
     */
    private parseStashLabel(stashNode: StashNode, template: string): string {
        return template
            .replace('${index}', stashNode.index.toString())
            .replace('${branch}', stashNode.branch ?? 'n/a')
            .replace('${description}', stashNode.description)
            .replace('${note}', stashNode.note ?? '')
            .replace('${dateTimeLong}', DateFormat.toFullyReadable(stashNode.date))
            .replace('${dateTimeSmall}', DateFormat.toDateTimeSmall(stashNode.date))
            .replace('${dateSmall}', DateFormat.toDateSmall(stashNode.date))
            .replace('${dateTimeIso}', DateFormat.toDateTimeIso(stashNode.date))
            .replace('${dateIso}', DateFormat.toDateIso(stashNode.date))
            .replace('${ago}', DateFormat.ago(stashNode.date))
            .trim()
    }

    /**
     * Generates a stashed file label.
     *
     * @param fileNode The node to be used as base
     */
    private parseFileLabel(fileNode: FileNode, template: string): string {
        return template
            .replace('${filename}', path.basename(fileNode.name))
            .replace('${oldFilename}', fileNode.oldName ? path.basename(fileNode.oldName) : '')
            .replace('${filepath}', `${path.dirname(fileNode.name)}/`)
            .replace('${type}', this.getTypeLabel(fileNode))
    }

    /**
     * Generates the diff document title name.
     *
     * @param fileNode the file node to be shown
     * @param diffHint the hint reference to know file origin
     */
    public getDiffTitle(fileNode: FileNode, diffHint: boolean | undefined): string {
        return this.config.get<string>('editor.diffTitleFormat')
            .replace('${filename}', path.basename(fileNode.name))
            .replace('${filepath}', `${path.dirname(fileNode.name)}/`)
            .replace('${dateTimeLong}', DateFormat.toFullyReadable(fileNode.date))
            .replace('${dateTimeSmall}', DateFormat.toDateTimeSmall(fileNode.date))
            .replace('${dateSmall}', DateFormat.toDateSmall(fileNode.date))
            .replace('${dateTimeIso}', DateFormat.toDateTimeIso(fileNode.date))
            .replace('${dateIso}', DateFormat.toDateIso(fileNode.date))
            .replace('${ago}', DateFormat.ago(fileNode.date))
            .replace('${stashIndex}', `${fileNode.parent.index}`)
            .replace('${description}', fileNode.parent.description)
            .replace('${branch}', fileNode.parent.branch ?? 'n/a')
            .replace('${type}', this.getTypeLabel(fileNode))
            .replace('${hint}', diffHint === undefined ? '' : this.getHint(fileNode, diffHint))
    }

    /**
     * Gets the node children count.
     *
     * @param stashNode the source node
     */
    private getChildrenCount(repositoryNode: RepositoryNode): string {
        const count = repositoryNode.childrenCount
        return typeof count === 'number' ? count.toString() : '-'
    }

    /**
     * Gets a label for the file node type.
     *
     * @param fileNode the source node
     */
    private getTypeLabel(fileNode: FileNode): string {
        switch (true) {
            case fileNode.isDeleted: return 'Deleted'
            case fileNode.isAdded: return 'Added'
            case fileNode.isModified: return 'Modified'
            case fileNode.isRenamed: return 'Renamed'
            case fileNode.isUntracked: return 'Untracked'
        }

        throw new Error(`getContent(): Unsupported fileNode type: ${fileNode.type}`)
    }

    /**
     * Generates a hint for the file node title.
     *
     * @param fileNode  the source node
     * @param fromStash the side of the hint
     */
    private getHint(fileNode: FileNode, fromStash: boolean): string {
        const type = this.getTypeLabel(fileNode).toLowerCase()
        const reference = fromStash ? 'original' : 'current'

        const values = fromStash
            ? { l: reference, r: type }
            : { l: type, r: reference }

        return `${values.l} ⟷ ${values.r}`
    }
}
