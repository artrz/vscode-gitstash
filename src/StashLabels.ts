/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

'use strict'

import * as DateFormat from './DateFormat'
import * as path from 'path'
import Config from './Config'
import NodeType from './StashNode/NodeType'
import StashNode from './StashNode/StashNode'

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
    public getName(node: StashNode): string {
        return this.getContent(node, 'label')
    }

    /**
     * Generates a node description.
     *
     * @param node The node to be used as base
     */
    public getDescription(node: StashNode): string {
        return this.getContent(node, 'description')
    }

    /**
     * Generates a node tooltip.
     *
     * @param node The node to be used as base
     */
    public getTooltip(node: StashNode): string {
        return this.getContent(node, 'tooltip')
    }

    /**
     * Generates clipboard text for the stash node.
     *
     * @param stashNode The node to be used as base
     */
    public clipboardTemplate(node: StashNode): string {
        return this.getContent(node, 'to-clipboard')
    }

    /**
     * Generates clipboard text for the stash node.
     *
     * @param stashNode The node to be used as base
     */
    public clipboardNode(node: StashNode): string {
        switch (node.type) {
            case NodeType.Repository:
                return node.path
            case NodeType.Stash:
                return node.name
            case NodeType.Deleted:
            case NodeType.IndexAdded:
            case NodeType.Modified:
            case NodeType.Untracked:
            case NodeType.Renamed:
                return node.path
        }
    }

    /**
     * Generates a node label.
     *
     * @param node The node to be used as base
     * @param property The string with the property prefix for setting keys
     */
    private getContent(node: StashNode, property: string): string {
        switch (node.type) {
            case NodeType.Repository:
                return this.parseRepositoryLabel(node, this.config.get(`explorer.items.repository.${property}Content`))
            case NodeType.Stash:
                return this.parseStashLabel(node, this.config.get(`explorer.items.stash.${property}Content`))
            case NodeType.Deleted:
            case NodeType.IndexAdded:
            case NodeType.Modified:
            case NodeType.Untracked:
                return this.parseFileLabel(node, this.config.get(`explorer.items.file.${property}Content`))
            case NodeType.Renamed:
                return this.parseFileLabel(node, this.config.get(`explorer.items.renamedFile.${property}Content`))
        }
    }

    /**
     * Generates a repository label.
     *
     * @param repositoryNode The node to be used as base
     */
    private parseRepositoryLabel(repositoryNode: StashNode, template: string): string {
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
            .replace('${branch}', this.getStashBranch(stashNode))
            .replace('${description}', this.getStashDescription(stashNode))
            .replace('${dateTimeLong}', DateFormat.toFullyReadable(new Date(Date.parse(stashNode.date))))
            .replace('${dateTimeSmall}', DateFormat.toDateTimeSmall(new Date(Date.parse(stashNode.date))))
            .replace('${dateSmall}', DateFormat.toDateSmall(new Date(Date.parse(stashNode.date))))
            .replace('${dateTimeIso}', DateFormat.toDateTimeIso(new Date(Date.parse(stashNode.date))))
            .replace('${dateIso}', DateFormat.toDateIso(new Date(Date.parse(stashNode.date))))
            .replace('${ago}', DateFormat.ago(new Date(Date.parse(stashNode.date))))
    }

    /**
     * Generates a stashed file label.
     *
     * @param fileNode The node to be used as base
     */
    private parseFileLabel(fileNode: StashNode, template: string): string {
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
     * @param hint     the hint reference to know file origin
     */
    public getDiffTitle(fileNode: StashNode, hint: boolean): string {
        return this.config.settings
            .get('editor.diffTitleFormat', '')
            .replace('${filename}', path.basename(fileNode.name))
            .replace('${filepath}', `${path.dirname(fileNode.name)}/`)
            .replace('${dateTimeLong}', DateFormat.toFullyReadable(new Date(Date.parse(fileNode.date))))
            .replace('${dateTimeSmall}', DateFormat.toDateTimeSmall(new Date(Date.parse(fileNode.date))))
            .replace('${dateSmall}', DateFormat.toDateSmall(new Date(Date.parse(fileNode.date))))
            .replace('${dateTimeIso}', DateFormat.toDateTimeIso(new Date(Date.parse(fileNode.date))))
            .replace('${dateIso}', DateFormat.toDateIso(new Date(Date.parse(fileNode.date))))
            .replace('${ago}', DateFormat.ago(new Date(Date.parse(fileNode.date))))
            .replace('${stashIndex}', `${fileNode.parent.index}`)
            .replace('${description}', this.getStashDescription(fileNode.parent))
            .replace('${branch}', this.getStashBranch(fileNode.parent))
            .replace('${type}', this.getTypeLabel(fileNode))
            .replace('${hint}', this.getHint(fileNode, hint))
    }

    /**
     * Gets the stash description.
     *
     * @param stashNode the source node
     */
    private getStashDescription(stashNode: StashNode): string {
        return stashNode.name.substring(stashNode.name.indexOf(':') + 2)
    }

    /**
     * Gets the stash branch.
     *
     * @param stashNode the source node
     */
    private getStashBranch(stashNode: StashNode): string {
        return stashNode.name.startsWith('WIP on ')
            ? stashNode.name.substring(7, stashNode.name.indexOf(':'))
            : stashNode.name.substring(3, stashNode.name.indexOf(':'))
    }

    /**
     * Gets the node children count.
     *
     * @param stashNode the source node
     */
    private getChildrenCount(repositoryNode: StashNode): string {
        const count = repositoryNode.childrenCount
        return !isNaN(count) ? count.toString() : '-'
    }

    /**
     * Gets a label for the file node type.
     *
     * @param fileNode the source node
     */
    private getTypeLabel(fileNode: StashNode): string {
        switch (fileNode.type) {
            case NodeType.Deleted: return 'Deleted'
            case NodeType.IndexAdded: return 'Added'
            case NodeType.Modified: return 'Modified'
            case NodeType.Renamed: return 'Renamed'
            case NodeType.Untracked: return 'Untracked'
            default: return 'Other'
        }
    }

    /**
     * Generates a hint for the file node title.
     *
     * @param fileNode the source node
     */
    private getHint(fileNode: StashNode, fromStash: boolean): string {
        const type = this.getTypeLabel(fileNode).toLowerCase()
        const reference = fromStash ? 'original' : 'current'

        const values = fromStash
            ? { l: reference, r: type }
            : { l: type, r: reference }

        return `${values.l} ⟷ ${values.r}`
    }
}
