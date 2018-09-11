'use strict';

import {
    commands,
    Event,
    EventEmitter,
    ThemeIcon,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    Uri
} from 'vscode';
import * as path from 'path';
import Config from './Config';
import Model from './Model';
import StashLabels from './StashLabels';
import StashNode, { NodeType } from './StashNode';

export default class GitStashTreeDataProvider implements TreeDataProvider<StashNode> {
    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private config: Config;
    private stashLabels: StashLabels;
    private model: Model;
    private rawStash: string;
    private loadTimeout;
    private showExplorer;

    constructor(config: Config, stashLabels: StashLabels) {
        this.config = config;
        this.stashLabels = stashLabels;
    }

    /**
     * Reloads the explorer tree.
     */
    public refresh = () => {
        this.reload('force');
    }

    /**
     * Toggles the explorer tree.
     */
    public toggle = () => {
        this.showExplorer = typeof this.showExplorer === 'undefined'
            ? this.config.settings.explorer.enabled
            : !this.showExplorer;

        commands.executeCommand(
            'setContext',
            'gitstash.explorer.enabled',
            this.showExplorer
        );
    }

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

        return this.getModel().getFiles(node);
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
            if (['settings', 'force'].indexOf(type) !== -1) {
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
        }, type === 'force' ? 250 : 750, type, event);
    }

    /**
     * Generates an stash tree item.
     *
     * @param node The node to be used as base
     */
    private getEntryItem(node: StashNode): TreeItem {
        return {
            label: this.stashLabels.getEntryName(node),
            tooltip: this.stashLabels.getEntryTooltip(node),
            iconPath: this.getIcon('chest.svg'),
            contextValue: 'diffEntry',
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            command: void 0
        };
    }

    /**
     * Generates a stashed file tree item.
     *
     * @param node The node to be used as base
     */
    private getFileItem(node: StashNode): TreeItem {
        return {
            label: this.stashLabels.getFileName(node),
            tooltip: this.stashLabels.getFileTooltip(node),
            iconPath: this.getFileIcon(node.type),
            contextValue: 'diffFile',
            collapsibleState: void 0,
            command: {
                title: 'Show stash diff',
                command: 'gitstash.show',
                arguments: [this.model, node]
            }
        };
    }

    /**
     * Builds an icon path.
     *
     * @param filename The filename of the icon
     */
    private getIcon(filename: string): { light: string; dark: string } {
        return {
            light: path.join(__filename, '..', '..', '..', 'resources', 'icons', 'light', filename),
            dark: path.join(__filename, '..', '..', '..', 'resources', 'icons', 'dark', filename)
        };
    }

    /**
     * Builds a file icon path.
     *
     * @param filename The filename of the icon
     */
    private getFileIcon(type: NodeType): { light: string; dark: string } | ThemeIcon {
        switch (type) {
            case NodeType.Modified: return this.getIcon('status-modified.svg');
            case NodeType.Untracked: return this.getIcon('status-untracked.svg');
            case NodeType.IndexAdded: return this.getIcon('status-added.svg');
            case NodeType.Deleted: return this.getIcon('status-deleted.svg');
            default: return ThemeIcon.File;
        }
    }

    /**
     * Returns the model to be used in this provider.
     */
    private getModel(): Model {
        return !this.model ? this.model = new Model() : this.model;
    }
}
