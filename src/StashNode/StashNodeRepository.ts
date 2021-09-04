'use strict'

import NodeType from './NodeType'
import StashGit, { RenameStash, Stash, StashedFiles } from '../Git/StashGit'
import StashNode from './StashNode'
import StashNodeFactory from './StashNodeFactory'
import WorkspaceGit from '../Git/WorkspaceGit'

export default class {
    private stashGit: StashGit
    private workspaceGit: WorkspaceGit
    private stashNodeFactory: StashNodeFactory

    constructor(workspaceGit: WorkspaceGit) {
        this.workspaceGit = workspaceGit
        this.stashGit = new StashGit()
        this.stashNodeFactory = new StashNodeFactory()
    }

    /**
     * Gets the repositories list.
     *
     * @param eagerLoadStashes indicates if children should be preloaded
     */
    public async getRepositories(eagerLoadStashes: boolean): Promise<StashNode[]> {
        return this.workspaceGit.getRepositories().then(async (rawList: string[]) => {
            const repositoryNodes: StashNode[] = []

            for (const repositoryPath of rawList) {
                const repositoryNode = this.stashNodeFactory.createRepositoryNode(repositoryPath)
                repositoryNodes.push(repositoryNode)

                if (eagerLoadStashes) {
                    repositoryNode.setChildren(await this.getChildren(repositoryNode))
                }
            }

            return repositoryNodes
        })
    }

    /**
     * Gets the node's children.
     */
    public async getChildren(node: StashNode): null | Promise<StashNode[]> {
        if (node.type === NodeType.Repository) {
            return this.getStashes(node)
        }

        if (node.type === NodeType.Stash) {
            return this.getFiles(node)
        }

        return Promise.resolve([] as StashNode[])
    }

    /**
     * Gets the stashes list.
     */
    private async getStashes(repositoryNode: StashNode): Promise<StashNode[]> {
        return this.stashGit.getStashes(repositoryNode.path).then((rawList: Stash[]) => {
            const stashNodes: StashNode[] = []
            rawList.forEach((stash: Stash) => {
                stashNodes.push(this.stashNodeFactory.createStashNode(stash, repositoryNode))
            })

            return stashNodes
        })
    }

    /**
     * Gets the stash files.
     *
     * @param stashNode the parent stash
     */
    private async getFiles(stashNode: StashNode): Promise<StashNode[]> {
        return this.stashGit.getStashedFiles(stashNode.path, stashNode.index).then((stashedFiles: StashedFiles) => {

            const fileNodes: StashNode[] = []
            const path = stashNode.path

            stashedFiles.indexAdded.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.IndexAdded))
            })

            stashedFiles.modified.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Modified))
            })

            stashedFiles.renamed.forEach((stashFile: RenameStash) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Renamed))
            })

            stashedFiles.untracked.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Untracked))
            })

            stashedFiles.deleted.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Deleted))
            })

            return fileNodes
        })
    }

    /**
     * Creates a message node.
     */
    public getMessageNode(message: string): StashNode {
        return this.stashNodeFactory.createMessageNode(message)
    }
}
