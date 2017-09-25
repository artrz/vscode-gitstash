'use strict';

import {
    Event,
    EventEmitter,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri
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
     * @param event
     * @param type
     */
    public reload(event: Uri, type: string): void {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = setTimeout((event, type) => {
            this.getModel().raw.then((rawStash) => {
                if (this.rawStash !== rawStash) {
                    this.rawStash = rawStash;
                    this._onDidChangeTreeData.fire();
                }
            });
        }, 1000, event, type);
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
        return {
            label: path.basename(node.name),
            // tooltip: node.name,
            contextValue: 'diffFile',
            collapsibleState: void 0,
            command: {
                title: 'Show stash diff',
                tooltip: 'Show stash diff',
                command: 'gitstash.show',
                arguments: [this.model, node],
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
        const description = node.name.substring(node.name.indexOf(':') + 2);
        const branch = node.name.indexOf('WIP on ') === 0
            ? node.name.substring(7, node.name.indexOf(':'))
            : node.name.substring(3, node.name.indexOf(':'));

        return {
            label: `[${branch}] ${description}`,
            // tooltip: node.date,
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
}
