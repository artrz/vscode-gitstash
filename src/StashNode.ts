'use strict';

interface Node {
    type: NodeType;
    name: string;
    oldName?: string;
    index?: number;
    parent?: StashNode;
    date?: string;
    path?: string;
}

export enum NodeType {
    'Repository' = 'r',
    'Stash' = 's',
    'Deleted' = 'd',
    'IndexAdded' = 'a',
    'Modified' = 'm',
    'Renamed' = 'n',
    'Untracked' = 'u',
}

export default class StashNode {
    constructor(private source: Node) {
    }

    /**
     * Gets the node type.
     */
    public get type(): NodeType {
        return this.source.type;
    }

    /**
     * Gets the node name.
     */
    public get name(): string {
        return this.source.name;
    }

    /**
     * Gets the node old name.
     */
    public get oldName(): string {
        return this.source.oldName;
    }

    /**
     * Gets the node index.
     */
    public get index(): number {
        return this.source.index;
    }

    /**
     * Gets the node parent index.
     */
    public get parent(): StashNode | null {
        return this.source.parent as StashNode;
    }

    /**
     * Gets the node generation date.
     */
    public get date(): string | null {
        return this.source.date;
    }

    /**
     * Indicates if the node represents a stashed file or not.
     */
    public get isFile(): boolean {
        return [
            NodeType.Deleted,
            NodeType.IndexAdded,
            NodeType.Modified,
            NodeType.Untracked
        ].indexOf(this.type) > -1;
    }

    /**
     * Gets the file path of the stashed file.
     */
    public get path(): string | null {
        if (this.type === NodeType.Repository) {
            return this.source.path;
        }

        if (this.type === NodeType.Stash) {
            return this.source.parent.path;
        }

        if (this.isFile) {
            return `${this.source.path}/${this.name}`;
        }

        return null;
    }
}
