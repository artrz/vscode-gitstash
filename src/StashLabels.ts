'use strict';

import * as path from 'path';
import Config from './Config';
import StashNode, { NodeType } from './StashNode';

export default class {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    /**
     * Generates a stash item name.
     *
     * @param node The node to be used as base
     */
    public getEntryName(node: StashNode): string {
        return this.parseItemLabel(node, this.config.settings.entryFormat);
    }

    /**
     * Generates a stash item tooltip.
     *
     * @param node The node to be used as base
     */
    public getEntryTooltip(node: StashNode): string {
        return this.parseItemLabel(node, this.config.settings.entryTooltipFormat);
    }

    /**
     * Generates a stash item label.
     *
     * @param node The node to be used as base
     */
    private parseItemLabel(node: StashNode, template: string): string {
        return template
            .replace('${index}', node.index.toString())
            .replace('${branch}', this.getEntryBranch(node))
            .replace('${description}', this.getEntryDescription(node))
            .replace('${date}', node.date);
    }

    /**
     * Generates a stashed file name.
     *
     * @param node The node to be used as base
     */
    public getFileName(node: StashNode): string {
        return this.parseFileLabel(node, this.config.settings.fileFormat);
    }

    /**
     * Generates a stashed file tooltip.
     *
     * @param node The node to be used as base
     */
    public getFileTooltip(node: StashNode): string {
        return this.parseFileLabel(node, this.config.settings.fileTooltipFormat);
    }

    /**
     * Generates a stashed file label.
     *
     * @param node The node to be used as base
     */
    private parseFileLabel(node: StashNode, template: string): string {
        return template
            .replace('${filename}', path.basename(node.name))
            .replace('${filepath}', `${path.dirname(node.name)}/`)
            .replace('${type}', this.getTypeLabel(node));
    }

    /**
     * Generates the diff document title name.
     *
     * @param node the file node to be shown
     */
    public getDiffTitle(node: StashNode): string {
        return this.config.settings.diffTitleFormat
            .replace('${filename}', path.basename(node.name))
            .replace('${filepath}', `${path.dirname(node.name)}/`)
            .replace('${date}', node.date)
            .replace('${stashIndex}', node.parent.index)
            .replace('${description}', this.getEntryDescription(node.parent))
            .replace('${branch}', this.getEntryBranch(node.parent))
            .replace('${type}', this.getTypeLabel(node));
    }

    /**
     * Gets the node entry branch.
     *
     * @param node the source node
     */
    private getEntryBranch(node: StashNode): string {
        return node.name.indexOf('WIP on ') === 0
            ? node.name.substring(7, node.name.indexOf(':'))
            : node.name.substring(3, node.name.indexOf(':'));
    }

    /**
     * Gets the node entry description.
     *
     * @param node the source node
     */
    private getEntryDescription(node: StashNode): string {
        return node.name.substring(node.name.indexOf(':') + 2);
    }

    /**
     * Gets a label for the node type.
     *
     * @param node the source node
     */
    private getTypeLabel(node: StashNode): string {
        switch (node.type) {
            case NodeType.Untracked: return 'Untracked';
            case NodeType.IndexAdded: return 'Index Added';
            case NodeType.Modified: return 'Modified';
            case NodeType.Deleted: return 'Deleted';
            default: return 'Other';
        }
    }
}
