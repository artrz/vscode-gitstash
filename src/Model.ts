'use strict';

import StashGit, { StashedFileContents, StashedFiles, StashEntry } from './StashGit';
import StashNode, { NodeType } from './StashNode';
import StashNodeFactory from './StashNodeFactory';

export default class Model {
    private git: StashGit;
    private stashNodeFactory: StashNodeFactory;

    constructor() {
        this.git = new StashGit();
        this.stashNodeFactory = new StashNodeFactory();
    }

    /**
     * Gets the raw git stash command data.
     */
    public get raw(): Thenable<string> {
        return this.git.getRawStash().then((rawData) => {
            return rawData;
        });
    }

    /**
     * Gets the stash entries list.
     */
    public get roots(): Thenable<StashNode[]> {
        return this.git.getStashList().then((rawList: StashEntry[]) => {
            const list = [];

            rawList.forEach((stashListItem: StashEntry) => {
                list.push(this.stashNodeFactory.entryToNode(stashListItem));
            });

            return list;
        });
    }

    /**
     * Gets the stashed files of a stash entry.
     *
     * @param node the parent entry
     */
    public getChildren(node: StashNode): Thenable<StashNode[]> {
        return this.git.getStashedFiles(node.index).then((stashedFiles: StashedFiles) => {

            const list = [];

            stashedFiles.modified.forEach((stashFile: string) => {
                list.push(this.stashNodeFactory.fileToNode(stashFile, node, NodeType.Modified));
            });

            stashedFiles.untracked.forEach((stashFile: string) => {
                list.push(this.stashNodeFactory.fileToNode(stashFile, node, NodeType.Untracked));
            });

            stashedFiles.indexedUntracked.forEach((stashFile: string) => {
                list.push(this.stashNodeFactory.fileToNode(stashFile, node, NodeType.IndexedUntracked));
            });

            stashedFiles.deleted.forEach((stashFile: string) => {
                list.push(this.stashNodeFactory.fileToNode(stashFile, node, NodeType.Deleted));
            });

            return list;
        });
    }

    /**
     * Gets the file contents of both, the base (original) and the modified data.
     *
     * @param node the stashed file node
     */
    public getStashedFile(node: StashNode): Thenable<StashedFileContents|null> {
        return node.isFile && node.type === NodeType.Modified
            ? this.git.getStashFileContents(node.parent.index, node.name)
                .then((rawContent: StashedFileContents) => {
                    return rawContent;
                })
            : null;
    }

    /**
     * Gets the file contents of the untracked file.
     *
     * @param node the stashed node file
     */
    public getUntrackedFile(node: StashNode): Thenable<string|null> {
        return node.isFile && node.type === NodeType.Untracked
            ? this.git.untrackedFileContents(node.parent.index, node.name).then((rawContent) => {
                return rawContent;
            })
            : null;
    }

    /**
     * Gets the file contents of the untracked file.
     *
     * @param node the stashed node file
     */
    public getIndexedUntrackedFile(node: StashNode): Thenable<string|null> {
        return node.isFile && node.type === NodeType.IndexedUntracked
            ? this.git.indexedUntrackedFileContents(node.parent.index, node.name).then((rawContent) => {
                return rawContent;
            })
            : null;
    }
}
