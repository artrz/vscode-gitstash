'use strict';

import { StashEntry } from './StashGit';
import StashNode, { NodeType } from './StashNode';

export default class {
    /**
     * Generates a node from a stash entry.
     *
     *@param entry The stash entry to use as base.
     */
    public entryToNode(entry: StashEntry): StashNode {
        return new StashNode({
            type: NodeType.Entry,
            name: entry.description,
            index: entry.index,
            parent: null,
            date: entry.date
        });
    }

    /**
     * Generates a node from a stashed file.
     *
     *@param entry The stash entry to use as base.
     */
    public fileToNode(file: string, parentNode: StashNode, type: NodeType): StashNode {
        return new StashNode({
            type: type,
            name: file,
            index: null,
            parent: parentNode,
            date: parentNode.date
        });
    }
}
