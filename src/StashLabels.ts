'use strict'

import * as path from 'path'
import Config from './Config'
import DateFormat from './DateFormat'
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
            .replace('${path}', path.dirname(repositoryNode.path))
            .replace('${directory}', path.basename(repositoryNode.path))
            .replace('${name}', repositoryNode.name)
            .replace('${stashesCount}', repositoryNode.children.length.toString())
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
        return stashNode.name.indexOf('WIP on ') === 0
            ? stashNode.name.substring(7, stashNode.name.indexOf(':'))
            : stashNode.name.substring(3, stashNode.name.indexOf(':'))
    }

    /**
     * Gets a label for the file node type.
     *
     * @param fileNode the source node
     */
    private getTypeLabel(fileNode: StashNode): string {
        switch (fileNode.type) {
            case NodeType.Deleted: return 'Deleted'
            case NodeType.IndexAdded: return 'Index Added'
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
        const reference = fromStash ? 'original' : 'actual'

        const values = fromStash
            ? {l: reference, r: type}
            : {l: type, r: reference}

        return `${values.l} ⟷ ${values.r}`
    }
}
