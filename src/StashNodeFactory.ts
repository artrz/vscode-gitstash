'use strict';

import { Uri, workspace } from 'vscode';
import { Stash } from './StashGit';
import StashNode, { NodeType } from './StashNode';

export default class {
    /**
     * Generates a repository node.
     *
     * @param path the repository path
     */
    public createRepositoryNode(path: string): StashNode {
        return new StashNode({
            type: NodeType.Repository,
            name: workspace.getWorkspaceFolder(Uri.file(path)).name,
            index: null,
            parent: null,
            date: null,
            path: path
        });
    }

    /**
     * Generates a stash node.
     *
     * @param stash the stash to use as base
     */
    public createStashNode(stash: Stash, parentNode: StashNode): StashNode {
        return new StashNode({
            type: NodeType.Stash,
            name: stash.description,
            index: stash.index,
            parent: parentNode,
            date: stash.date
        });
    }

    /**
     * Generates a file node.
     *
     * @param path       the file path
     * @param file       the file name or the new and old name on renamed file
     * @param parentNode the parent node
     * @param type       the stash type
     */
    public createFileNode(path: string, file: string|any, parentNode: StashNode, type: NodeType): StashNode {
        return new StashNode({
            type: type,
            name: type === NodeType.Renamed ? file.new : file,
            oldName: type === NodeType.Renamed ? file.old : null,
            path: path,
            index: null,
            parent: parentNode,
            date: parentNode.date
        });
    }
}
