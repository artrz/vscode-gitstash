'use strict'

import StashGit from '../Git/StashGit'
import StashNode from './StashNode'
import StashNodeChildren from './StashNodeChildren'
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
     */
    public async getRepositories(): Promise<StashNode[]> {
        return this.workspaceGit.getRepositories().then(async (rawList: string[]) => {
            const repositoryNodes: StashNode[] = []

            for (const repositoryPath of rawList) {
                let repositoryNode: StashNode = null
                const hasData = await this.stashGit.getRawStash(repositoryPath)

                repositoryNode = this.stashNodeFactory.createRepositoryNode(repositoryPath)

                if (hasData) {
                    const nodeChildren = new StashNodeChildren()

                    repositoryNode.children = await nodeChildren.getChildren(repositoryNode)
                        .then((children: StashNode[]) => {
                            repositoryNode.children = children

                            repositoryNode.children.forEach((stashNode: StashNode) => {
                                void nodeChildren.getChildren(stashNode).then((childs) => stashNode.children = childs)
                            })

                            return repositoryNode.children
                        })
                }

                repositoryNodes.push(repositoryNode)
            }

            return repositoryNodes
        })
    }
}
