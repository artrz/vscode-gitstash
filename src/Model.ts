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
            let list = [];

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
     * @param node The parent entry
     */
    public getChildren(node: StashNode): Thenable<StashNode[]> {
        return this.git.getStashFiles(node.index).then((rawList) => {
            let list = [];

            rawList.forEach((stashFile) => {
                list.push(new StashNode({
                    name: stashFile.file,
                    index: stashFile.index,
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
     * @param node The stashed file node
     */
    public getStashedFile(node: StashNode): Thenable<any> {
        return node.isFile
            ? this.git.getStashFileContents(node.parent.index, node.name).then((rawContent) => {
                return {
                    base: rawContent[0],
                    modified: rawContent[1]
                };
            })
            : null;
    }
}
