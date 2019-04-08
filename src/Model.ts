'use strict';

import StashGit, { Stash, StashedFileContents, StashedFiles } from './StashGit';
import StashNode, { NodeType } from './StashNode';
import StashNodeFactory from './StashNodeFactory';

export default class Model {
    private stashGit: StashGit;
    private stashNodeFactory: StashNodeFactory;

    constructor() {
        this.stashGit = new StashGit();
        this.stashNodeFactory = new StashNodeFactory();
    }

    /**
     * Gets the raw git stashes list.
     */
    public getRawStashesList(cwd: string): Thenable<string> {
        return this.stashGit.getRawStash(cwd).then((rawData) => {
            return rawData;
        });
    }

    /**
     * Gets the repositories list.
     */
    public getRepositories(): Thenable<StashNode[]> {
        return this.stashGit.getRepositories().then((rawList: string[]) => {
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
    public getStashes(repositoryNode: StashNode): Thenable<StashNode[]> {
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
    public getFiles(stashNode: StashNode): Thenable<StashNode[]> {
        return this.stashGit.getStashedFiles(stashNode.path, stashNode.index).then((stashedFiles: StashedFiles) => {

            const fileNodes = [];
            const path = stashNode.path;

            stashedFiles.modified.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Modified));
            });

            stashedFiles.untracked.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Untracked));
            });

            stashedFiles.indexAdded.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.IndexAdded));
            });

            stashedFiles.deleted.forEach((stashFile: string) => {
                fileNodes.push(this.stashNodeFactory.createFileNode(path, stashFile, stashNode, NodeType.Deleted));
            });

            return fileNodes;
        });
    }

    /**
     * Gets the file contents of both, the base (original) and the modified data.
     *
     * @param fileNode the stashed file node
     */
    public getStashedFile(fileNode: StashNode): Thenable<StashedFileContents | null> {
        return this.stashGit.getStashFileContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
            .then((rawContent: StashedFileContents) => {
                return rawContent;
            });
    }

    /**
     * Gets the file contents of the untracked file.
     *
     * @param fileNode the stashed node file
     */
    public getFileContents(fileNode: StashNode): Thenable<Buffer | string> {
        switch (fileNode.type) {
            case NodeType.Untracked:
                return this.stashGit.untrackedFileContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
                    .then((rawContent) => {
                        return rawContent;
                    });
            case NodeType.IndexAdded:
                return this.stashGit.indexAddedFileContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
                    .then((rawContent) => {
                        return rawContent;
                    });
            case NodeType.Deleted:
                return this.stashGit.deletedFileContents(fileNode.parent.path, fileNode.parent.index, fileNode.name)
                    .then((rawContent) => {
                        return rawContent;
                    });
        }
    }
}
