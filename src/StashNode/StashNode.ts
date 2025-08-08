/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import FileNode from './FileNode'
import Node from './Node'
import RepositoryNode from './RepositoryNode'

export default class StashNode extends Node {
    constructor(
        protected _name: string,
        protected _index: number,
        protected _parent: RepositoryNode,
        protected _date: string,
        protected _hash: string,
        protected _children: FileNode[] | undefined = undefined,
    ) {
        super(_name)
    }

    /**
     * Gets the node index.
     */
    public get index(): number {
        return this._index
    }

    /**
     * Gets the node parent index.
     */
    public get parent(): RepositoryNode {
        return this._parent
    }

    /**
     * Gets the node generation date.
     */
    public get date(): string {
        return this._date
    }

    /**
     * Gets the node commit hash.
     */
    public get hash(): string {
        return this._hash
    }

    /**
     * Gets the file path of the stashed file.
     */
    public get path(): string {
        return this._parent.path
    }

    /**
     * Gets the loaded children.
     */
    public get children(): FileNode[] | undefined {
        return this._children
    }

    /**
     * Gets the children count if available.
     */
    public get childrenCount(): number | undefined {
        return this._children
            ? this._children.length
            : undefined
    }

    /**
     * Sets the node children.
     */
    public setChildren(children: FileNode[]): this {
        this._children = children
        return this
    }

    public toString() {
        return `StashNode[${this.name}]`
    }

    public get id(): string {
        return `S.${this.parent.path}.${this.hash}`
    }
}
