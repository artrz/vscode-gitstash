'use strict';

import {
    Event,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri,
    workspace
} from 'vscode';
import * as path from 'path';
import Model from './Model';
import StashNode from './StashNode';

export default class GitStashTreeDataProvider implements TreeDataProvider<StashNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;
    private model: Model;
    private rawStash: string;
    private loadTimeout;
    private config;

    /**
     * Gets the tree children, (root) stash entries, or entry files.
     *
     * @param node If specified, return the files list, if not, the stash list
     */
    public getChildren(node?: StashNode): Thenable<StashNode[]> {
        if (!node) {
            this.getModel().raw.then((rawStash) => {
                this.rawStash = rawStash;
            });

            this.loadConfig();

            return this.getModel().roots;
        }

        return this.getModel().getChildren(node);
    }

    /**
     * Generates a tree item for the specified node.
     *
     * @param node The node to be used as base
     */
    public getTreeItem(node: StashNode): TreeItem {
        return node.isFile
            ? this.getFileItem(node)
            : this.getEntryItem(node);
    }

    /**
     * Reloads the git stash tree view.
     *
     * @param type the event type
     * @param event The event file URI
     */
    public reload(type: string, event?: Uri): void {
        if (this.loadTimeout) {
            clearTimeout(this.loadTimeout);
        }

        this.loadTimeout = setTimeout((type: string, event?: Uri) => {
            if (type === 's') {
                this._onDidChangeTreeData.fire();
            }
            else {
                this.getModel().raw.then((rawStash) => {
                    if (this.rawStash !== rawStash) {
                        this.rawStash = rawStash;
                        this._onDidChangeTreeData.fire();
                    }
                });
            }
        }, 750, type, event);
    }

    /**
     * Gets the diff document title.
     *
     * @param node the file node to be shown
     */
    public getDiffTitle(node: StashNode): string {
        return this.config.diffTitleFormat
            .replace('${fileIndex}', node.index)
            .replace('${filename}', path.basename(node.name))
            .replace('${filepath}', path.dirname(node.name))
            .replace('${date}', node.date)
            .replace('${stashIndex}', node.parent.index)
            .replace('${description}', this.getEntryDescription(node.parent))
            .replace('${branch}', this.getEntryBranch(node.parent));
    }

    /**
     * Return the model to be used in this provider.
     */
    private getModel(): Model {
        return !this.model
            ? this.model = new Model()
            : this.model;
    }

    /**
     * Generates a stashed file tree item.
     *
     * @param node The node to be used as base
     */
    private getFileItem(node: StashNode): TreeItem {
        const index = node.index;
        const filename = path.basename(node.name);
        const filepath = path.dirname(node.name);

        return {
            label: this.config.fileFormat
                .replace('${index}', index)
                .replace('${filename}', filename)
                .replace('${filepath}', filepath),
            // tooltip: this.config.fileFormat
            //     .replace('${index}', index)
            //     .replace('${filename}', filename)
            //     .replace('${filepath}', filepath),
            contextValue: 'diffFile',
            collapsibleState: void 0,
            command: {
                title: 'Show stash diff',
                tooltip: 'Show stash diff',
                command: 'gitstash.show',
                arguments: [this.model, node]
            },
            iconPath: {
                light: this.getIcon('light', 'file.png'),
                dark: this.getIcon('dark', 'file.png')
            }
        };
    }

    /**
     * Generates an stash tree item.
     *
     * @param node The node to be used as base
     */
    private getEntryItem(node: StashNode): TreeItem {
        const index = node.index;
        const date = node.date;
        const description = this.getEntryDescription(node);
        const branch = this.getEntryBranch(node);

        return {
            label: this.config.entryFormat
                .replace('${index}', index)
                .replace('${branch}', branch)
                .replace('${description}', description)
                .replace('${date}', date),
            // tooltip: this.config.entryFormat
            //     .replace('${index}', index)
            //     .replace('{$branch}', branch)
            //     .replace('{$description}', description)
            //     .replace('{$date}', date),
            contextValue: 'diffEntry',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            command: void 0,
            iconPath: {
                light: this.getIcon('light', 'chest.png'),
                dark: this.getIcon('dark', 'chest.png')
            }
        };
    }

    /**
     * Builds an icon path.
     *
     * @param scheme   The dark/light scheme
     * @param filename The filename of the icon
     */
    private getIcon(scheme: string, filename: string): string {
        return path.join(__filename, '..', '..', '..', 'resources', scheme, filename);
    }

    /**
     * Loads the plugin config.
     */
    private loadConfig() {
        this.config = workspace.getConfiguration('gitstash');
    }

    /**
     * Gets the node entry description.
     *
     * @param node the source node
     */
    private getEntryDescription(node: StashNode) {
        return node.name.substring(node.name.indexOf(':') + 2);
    }

    /**
     * Gets the node entry branch.
     *
     * @param node the source node
     */
    private getEntryBranch(node: StashNode) {
        return node.name.indexOf('WIP on ') === 0
            ? node.name.substring(7, node.name.indexOf(':'))
            : node.name.substring(3, node.name.indexOf(':'));
    }
}
