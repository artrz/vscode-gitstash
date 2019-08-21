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
     * Generates a node name.
     *
     * @param node The node to be used as base
     */
    public getName(node: StashNode): string {
        switch (node.type) {
            case NodeType.Repository:
                return this.parseRepositoryLabel(node, this.config.settings.repositoryFormat);
            case NodeType.Stash:
                return this.parseStashLabel(node, this.config.settings.stashFormat);
            case NodeType.Deleted:
                return this.parseFileLabel(node, this.config.settings.fileFormat);
            case NodeType.IndexAdded:
                return this.parseFileLabel(node, this.config.settings.fileFormat);
            case NodeType.Modified:
                return this.parseFileLabel(node, this.config.settings.fileFormat);
            case NodeType.Renamed:
                return this.parseFileLabel(node, this.config.settings.renamedFileFormat);
            case NodeType.Untracked:
                return this.parseFileLabel(node, this.config.settings.fileFormat);
        }
    }

    /**
     * Generates a node tooltip.
     *
     * @param node The node to be used as base
     */
    public getTooltip(node: StashNode): string {
        switch (node.type) {
            case NodeType.Repository:
                return this.parseRepositoryLabel(node, this.config.settings.repositoryTooltipFormat);
            case NodeType.Stash:
                return this.parseStashLabel(node, this.config.settings.stashTooltipFormat);
            case NodeType.Deleted:
                return this.parseFileLabel(node, this.config.settings.fileTooltipFormat);
            case NodeType.IndexAdded:
                return this.parseFileLabel(node, this.config.settings.fileTooltipFormat);
            case NodeType.Modified:
                return this.parseFileLabel(node, this.config.settings.fileTooltipFormat);
            case NodeType.Renamed:
                return this.parseFileLabel(node, this.config.settings.renamedFileTooltipFormat);
            case NodeType.Untracked:
                return this.parseFileLabel(node, this.config.settings.fileTooltipFormat);
        }
    }

    /**
     * Generates a repository label.
     *
     * @param repositoryNode The node to be used as base
     */
    private parseRepositoryLabel(repositoryNode: StashNode, template: string): string {
        return template
            .replace('${name}', repositoryNode.name)
            .replace('${directory}', path.basename(repositoryNode.path))
            .replace('${path}', repositoryNode.path);
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
            .replace('${date}', stashNode.date);
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
            .replace('${type}', this.getTypeLabel(fileNode));
    }

    /**
     * Generates the diff document title name.
     *
     * @param fileNode the file node to be shown
     * @param hint     the hint reference to know file origin
     */
    public getDiffTitle(fileNode: StashNode, hint: boolean): string {
        return this.config.settings.diffTitleFormat
            .replace('${filename}', path.basename(fileNode.name))
            .replace('${filepath}', `${path.dirname(fileNode.name)}/`)
            .replace('${date}', fileNode.date)
            .replace('${stashIndex}', fileNode.parent.index)
            .replace('${description}', this.getStashDescription(fileNode.parent))
            .replace('${branch}', this.getStashBranch(fileNode.parent))
            .replace('${type}', this.getTypeLabel(fileNode))
            .replace('${hint}', this.getHint(fileNode, hint));
    }

    /**
     * Gets the stash description.
     *
     * @param stashNode the source node
     */
    private getStashDescription(stashNode: StashNode): string {
        return stashNode.name.substring(stashNode.name.indexOf(':') + 2);
    }

    /**
     * Gets the stash branch.
     *
     * @param stashNode the source node
     */
    private getStashBranch(stashNode: StashNode): string {
        return stashNode.name.indexOf('WIP on ') === 0
            ? stashNode.name.substring(7, stashNode.name.indexOf(':'))
            : stashNode.name.substring(3, stashNode.name.indexOf(':'));
    }

    /**
     * Gets a label for the file node type.
     *
     * @param fileNode the source node
     */
    private getTypeLabel(fileNode: StashNode): string {
        switch (fileNode.type) {
            case NodeType.Deleted: return 'Deleted';
            case NodeType.IndexAdded: return 'Index Added';
            case NodeType.Modified: return 'Modified';
            case NodeType.Renamed: return 'Renamed';
            case NodeType.Untracked: return 'Untracked';
            default: return 'Other';
        }
    }

    /**
     * Generates a hint for the file node title.
     *
     * @param fileNode the source node
     */
    private getHint(fileNode: StashNode, fromStash: boolean): string {
        const type = this.getTypeLabel(fileNode).toLowerCase();
        const reference = fromStash ? 'original' : 'actual';

        const values = fromStash
            ? {l: reference, r: type}
            : {l: type, r: reference};

        return `${values.l} ⟷ ${values.r}`;
    }
}
