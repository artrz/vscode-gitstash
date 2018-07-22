'use strict';

import * as path from 'path';
import Config from './Config';
import StashNode from './StashNode';

export default class {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    /**
     * Generates the stash tree item name.
     *
     * @param node The node to be used as base
     */
    public getEntryName(node: StashNode): string {
        return this.config.settings.entryFormat
            .replace('${index}', node.index)
            .replace('${branch}', this.getEntryBranch(node))
            .replace('${description}', this.getEntryDescription(node))
            .replace('${date}', node.date);
    }

    /**
     * Generates the stashed file tree item.
     *
     * @param node The node to be used as base
     */
    public getFileName(node: StashNode): string {
        return this.config.settings.fileFormat
            .replace('${filename}', path.basename(node.name))
            .replace('${filepath}', `${path.dirname(node.name)}/`);
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
            .replace('${branch}', this.getEntryBranch(node.parent));
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
}
