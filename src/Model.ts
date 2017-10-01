'use strict';

import Git from './Git';
import StashNode from './StashNode';

export default class Model {
    private git: Git;

    constructor() {
        this.git = new Git();
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
        return this.git.getStashList().then((rawList) => {
            const list = [];

            rawList.forEach((stashListItem) => {
                list.push(new StashNode({
                    name: stashListItem.description,
                    index: stashListItem.index,
                    parent: null,
                    date: stashListItem.date
                }));
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
        return this.git.getStashedFiles(node.index).then((rawList) => {
                const list = [];

                rawList.modified.forEach((stashFile) => {
                    list.push(new StashNode({
                        name: stashFile.file,
                        index: stashFile.index,
                        parent: node,
                        date: node.date
                    }));
                });

                rawList.untracked.forEach((stashFile) => {
                    list.push(new StashNode({
                        name: stashFile.file,
                        index: null,
                        parent: node,
                        date: node.date
                    }));
                });

                return list;
        });
    }

    /**
     * Gets the file contents of both, the base (original) and the modified data.
     *
     * @param node the stashed file node
     */
    public getStashedFile(node: StashNode): Thenable<any> {
        return node.isFile && node.isTracked
            ? this.git.getStashFileContents(node.parent.index, node.name).then((rawContent) => {
                return {
                    base: rawContent[0],
                    modified: rawContent[1]
                };
            })
            : null;
    }

    /**
     * Gets the file contents of the untracked file.
     *
     * @param node the stashed node file
     */
    public getUntrackedFile(node: StashNode): Thenable<string> {
        return node.isFile && !node.isTracked
            ? this.git.untrackedFileContents(node.parent.index, node.name).then((rawContent) => {
                return rawContent;
            })
            : null;
    }
}
