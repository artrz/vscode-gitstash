'use strict';

import StashGit, { Stash, StashedFiles } from '../Git/StashGit';
import StashNode from './StashNode';
import NodeType from './NodeType';
import StashNodeFactory from './StashNodeFactory';
import WorkspaceGit from '../Git/WorkspaceGit';

export default class RepositoryTreeBuilder {
    private stashGit: StashGit;
    private workspaceGit: WorkspaceGit;
    private stashNodeFactory: StashNodeFactory;

    constructor(workspaceGit: WorkspaceGit) {
        this.workspaceGit = workspaceGit;
        this.stashGit = new StashGit();
        this.stashNodeFactory = new StashNodeFactory();
    }

    /**
     * Generates all the repository trees.
     */
    public async buildRepositoryTrees(): Promise<StashNode[]> {
        const repositoryNodes = await this.getRepositories();

        for (const repositoryNode of repositoryNodes) {
            await this.buildRepositoryTree(repositoryNode);
        }

        return repositoryNodes;
    }

    /**
     * Generates repository tree for the given node.
     */
    private async buildRepositoryTree(repositoryNode: StashNode): Promise<StashNode> {
        repositoryNode.children = await this.getStashes(repositoryNode);

        repositoryNode.children.forEach(async (stash) => {
            stash.children = await this.getFiles(stash);
        });

        return repositoryNode;
    }

    /**
     * Gets the repositories list.
     */
    private async getRepositories(): Promise<StashNode[]> {
        return this.workspaceGit.getRepositories().then((rawList: string[]) => {
            const repositoryNodes = [];
            rawList.forEach((repositoryPath: string) => {
                repositoryNodes.push(this.stashNodeFactory.createRepositoryNode(repositoryPath));
            });

            return repositoryNodes;
        });
    }

    /**
     * Gets the stashes list.
     */
    private async getStashes(repositoryNode: StashNode): Promise<StashNode[]> {
        return this.stashGit.getStashes(repositoryNode.path).then((rawList: Stash[]) => {
            const stashNodes = [];
            rawList.forEach((stash: Stash) => {
                stashNodes.push(this.stashNodeFactory.createStashNode(stash, repositoryNode));
            });

            return stashNodes;
        });
    }

    /**
     * Gets the stash files.
     *
     * @param stashNode the parent stash
     */
    private async getFiles(stashNode: StashNode): Promise<StashNode[]> {
        return this.stashGit.getStashedFiles(stashNode.path, stashNode.index).then((stashedFiles: StashedFiles) => {

            const fileNodes = [];
            const path = stashNode.path;

            stashedFiles.indexAdded.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.IndexAdded));
            });

            stashedFiles.modified.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Modified));
            });

            stashedFiles.renamed.forEach((stashFile: any) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Renamed));
            });

            stashedFiles.untracked.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Untracked));
            });

            stashedFiles.deleted.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Deleted));
            });

            return fileNodes;
        });
    }
}
