'use strict';

interface Node {
    type: NodeType;
    name: string;
    index?: number;
    parent?: StashNode;
    date?: string;
}

export enum NodeType {
    'Entry' = 'e',
    'Untracked' = 'u',
    'IndexAdded' = 'a',
    'Modified' = 'm',
    'Deleted' = 'd'
}

export default class StashNode {
    constructor(private entry: Node) {
    }

    /**
     * Gets the node type.
     */
    public get type(): NodeType {
        return this.entry.type;
    }

    /**
     * Gets the node name.
     */
    public get name(): string {
        return this.entry.name;
    }

    /**
     * Gets the node index.
     */
    public get index(): number {
        return this.entry.index;
    }

    /**
     * Gets the node parent index.
     */
    public get parent(): StashNode | null {
        return this.entry.parent as StashNode;
    }

    /**
     * Gets the node generation date.
     */
    public get date(): string | null {
        return this.entry.date;
    }

    /**
     * Indicates if the node represents a stashed file or not.
     */
    public get isFile(): boolean {
        return this.entry.parent !== null;
    }
}
