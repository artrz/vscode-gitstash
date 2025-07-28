'use strict'

import Node from './Node'
import NodeType from './NodeType'

export default class StashNode {
    private childrenCache: StashNode[] = null

    constructor(private source: Node) {
    }

    /**
     * Gets the node type.
     */
    public get type(): NodeType {
        return this.source.type
    }

    /**
     * Gets the node name.
     */
    public get name(): string {
        return this.source.name
    }

    /**
     * Gets the node old name.
     */
    public get oldName(): string {
        return this.source.oldName
    }

    /**
     * Gets the node index.
     */
    public get index(): number {
        return this.source.index
    }

    /**
     * Gets the node parent index.
     */
    public get parent(): StashNode | null {
        return this.source.parent as StashNode
    }

    /**
     * Gets the node generation date.
     */
    public get date(): string | null {
        return this.source.date
    }

    /**
     * Gets the node commit hash.
     */
    public get hash(): string | null {
        return this.source.hash
    }

    /**
     * Gets the loaded children.
     */
    public get children(): StashNode[] | null {
        return this.childrenCache
    }

    /**
     * Indicates if the node represents a stashed file or not.
     */
    public get isFile(): boolean {
        return [
            NodeType.Deleted,
            NodeType.IndexAdded,
            NodeType.Modified,
            NodeType.Untracked,
        ].includes(this.type)
    }

    /**
     * Gets the file path of the stashed file.
     */
    public get path(): string | null {
        if (this.type === NodeType.Repository) {
            return this.source.path
        }

        if (this.type === NodeType.Stash) {
            return this.source.parent.path
        }

        if (this.isFile) {
            return `${this.source.path}/${this.name}`
        }

        return null
    }

    /**
     * Gets the children count if available.
     */
    public get childrenCount(): number | undefined {
        return this.childrenCache !== null
            ? this.childrenCache.length
            : undefined
    }

    /**
     * Sets the node children.
     */
    public setChildren(children: StashNode[]): this {
        this.childrenCache = children
        return this
    }
}
