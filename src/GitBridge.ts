'use strict'

import StashGit, { FileStage } from './Git/StashGit'
import NodeType from './StashNode/NodeType'
import StashNode from './StashNode/StashNode'

export default class GitBridge {
    private stashGit: StashGit

    constructor() {
        this.stashGit = new StashGit()
    }

    /**
     * Gets the raw git stashes list.
     */
    public async getRawStashesList(cwd: string): Promise<string> {
        return this.stashGit.getRawStash(cwd)
    }

    /**
     * Gets the file contents of the untracked file.
     *
     * @param fileNode the stashed node file
     * @param stage    the file stash stage
     */
    public getFileContents(fileNode: StashNode, stage?: FileStage): Promise<Buffer | string> {
        switch (fileNode.type) {
            case NodeType.Deleted:
                return this.stashGit.getParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
            case NodeType.IndexAdded:
                return this.stashGit.getStashContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
            case NodeType.Modified:
                return stage === FileStage.Parent
                    ? this.stashGit.getParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
                    : this.stashGit.getStashContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
            case NodeType.Renamed:
                return stage === FileStage.Parent
                    ? this.stashGit.getParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.oldName)
                    : this.stashGit.getStashContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
            case NodeType.Untracked:
                return this.stashGit.getThirdParentContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
        }
    }
}
