/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import StashGit, { FileStage, RenameStash, Stash, StashedFiles } from '../Git/StashGit'
import FileNode from './FileNode'
import MessageNode from './MessageNode'
import NodeFactory from './NodeFactory'
import RepositoryNode from './RepositoryNode'
import StashNode from './StashNode'
import WorkspaceGit from '../Git/WorkspaceGit'

export default class NodeContainer {
    private stashGit: StashGit
    private workspaceGit: WorkspaceGit
    private nodeFactory: NodeFactory

    constructor(workspaceGit: WorkspaceGit) {
        this.workspaceGit = workspaceGit
        this.stashGit = new StashGit()
        this.nodeFactory = new NodeFactory()
    }

    /**
     * Gets the raw git stashes list.
     */
    public async getRawStashesList(cwd: string): Promise<null | string> {
        return this.stashGit.getRawStash(cwd)
    }

    /**
     * Gets the repositories list.
     *
     * @param eagerLoadStashes indicates if children should be preloaded
     */
    public async getRepositories(eagerLoadStashes: boolean): Promise<RepositoryNode[]> {
        return this.workspaceGit.getRepositories().then(async (paths: string[]) => {
            const repositoryNodes: RepositoryNode[] = []

            for (const repositoryPath of paths) {
                const repositoryNode = this.nodeFactory.createRepositoryNode(repositoryPath)
                repositoryNodes.push(repositoryNode)

                if (eagerLoadStashes) {
                    repositoryNode.setChildren(await this.getStashes(repositoryNode))
                }
            }

            return repositoryNodes
        })
    }

    /**
     * Gets the stashes list.
     */
    public async getStashes(repositoryNode: RepositoryNode): Promise<StashNode[]> {
        return (await this.stashGit.getStashes(repositoryNode.path))
            .map((stash: Stash) => this.nodeFactory.createStashNode(stash, repositoryNode))
    }

    /**
     * Gets the stash files.
     *
     * @param stashNode the parent stash
     */
    public async getFiles(stashNode: StashNode): Promise<FileNode[]> {
        return this.stashGit.getStashedFiles(stashNode.path, stashNode.index).then((stashedFiles: StashedFiles) => {
            const fileNodes: FileNode[] = []
            const path = stashNode.path

            stashedFiles.added.forEach((stashFile: string) => {
                fileNodes.push(this.nodeFactory.createAddedFileNode(path, stashFile, stashNode))
            })

            stashedFiles.modified.forEach((stashFile: string) => {
                fileNodes.push(this.nodeFactory.createModifiedFileNode(path, stashFile, stashNode))
            })

            stashedFiles.renamed.forEach((stashFile: RenameStash) => {
                fileNodes.push(this.nodeFactory.createRenamedFileNode(path, stashFile, stashNode))
            })

            stashedFiles.untracked.forEach((stashFile: string) => {
                fileNodes.push(this.nodeFactory.createUntrackedFileNode(path, stashFile, stashNode))
            })

            stashedFiles.deleted.forEach((stashFile: string) => {
                fileNodes.push(this.nodeFactory.createDeletedFileNode(path, stashFile, stashNode))
            })

            return fileNodes
        })
    }

    /**
     * Gets the file contents of the untracked file.
     *
     * @param fileNode the stashed file node
     * @param stage    the file stash stage
     */
    public getFileContents(fileNode: FileNode, stage?: FileStage): Promise<string> {
        if (fileNode.isAdded) {
            return this.stashGit.getStashContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
        }
        if (fileNode.isDeleted) {
            return this.stashGit.getParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
        }
        if (fileNode.isModified) {
            return stage === FileStage.Parent
                ? this.stashGit.getParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
                : this.stashGit.getStashContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
        }
        if (fileNode.isRenamed) {
            return stage === FileStage.Parent
                ? this.stashGit.getParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.oldName!)
                : this.stashGit.getStashContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
        }
        if (fileNode.isUntracked) {
            return this.stashGit.getThirdParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
        }

        throw new Error(`Unsupported fileNode type: ${fileNode.type}`);
    }

    /**
     * Creates a message node.
     */
    public getMessageNode(message: string): MessageNode {
        return this.nodeFactory.createMessageNode(message)
    }
}
