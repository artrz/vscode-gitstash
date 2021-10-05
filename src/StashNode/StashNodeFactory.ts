'use strict'

import { RenameStash, Stash } from '../Git/StashGit'
import { Uri, workspace } from 'vscode'
import NodeType from './NodeType'
import StashNode from './StashNode'
import { basename } from 'path'

export default class {
    /**
     * Generates a repository node.
     *
     * @param path the repository path
     */
    public createRepositoryNode(path: string): StashNode {
        // may be undefined if the directory is not part of the workspace
        // this happens on upper directories by negative search depth setting
        const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(path))

        return new StashNode({
            type: NodeType.Repository,
            name: workspaceFolder ? workspaceFolder.name : basename(path),
            index: undefined,
            parent: undefined,
            date: undefined,
            path: path,
        })
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
            date: stash.date,
            hash: stash.hash,
        })
    }

    /**
     * Generates a file node.
     *
     * @param path       the file path
     * @param file       the file name or the new and old name on renamed file
     * @param parentNode the parent node
     * @param type       the stash type
     */
    public createFileNode(path: string, file: string|RenameStash, parentNode: StashNode, type: NodeType): StashNode {
        return new StashNode({
            type: type,
            name: type === NodeType.Renamed ? (file as RenameStash).new : file as string,
            oldName: type === NodeType.Renamed ? (file as RenameStash).old : undefined,
            path: path,
            index: undefined,
            parent: parentNode,
            date: parentNode.date,
        })
    }

    /**
     * Generates a message node.
     *
     * @param message    the message to display
     * @param parentNode the parent node
     */
    public createMessageNode(message: string, parentNode?: StashNode): StashNode {
        return new StashNode({
            type: NodeType.Message,
            name: message,
            oldName: undefined,
            index: undefined,
            parent: parentNode,
            date: parentNode ? parentNode.date : undefined,
        })
    }
}
