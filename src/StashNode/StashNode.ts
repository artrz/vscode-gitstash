/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import FileNode from './FileNode'
import Node from './Node'
import RepositoryNode from './RepositoryNode'

export default class StashNode extends Node {
    protected _description: string
    protected _branch: string | undefined

    constructor(
        subject: string,
        protected _index: number,
        protected _parent: RepositoryNode,
        protected _date: Date,
        protected _hash: string,
        protected _shortHash: string,
        protected _parentHashes: string[],
        protected _note?: string,
        protected _children?: FileNode[],
    ) {
        super(subject)
        const parts = /(^WIP\son|^On)\s([^:\s]+):\s(.*)/i.exec(subject) ?? []
        this._description = parts.at(-1) ?? subject
        this._branch = parts.at(-2)
    }

    /**
     * Gets the node index.
     */
    public get index(): number {
        return this._index
    }

    /**
     * Gets the node index with the stash@{N} format.
     */
    public get atIndex(): string {
        return `stash@{${this._index}}`
    }

    /**
     * Gets the node description.
     */
    public get description(): string {
        return this._description
    }

    /**
     * Gets the node branch name.
     */
    public get branch(): string | undefined {
        return this._branch
    }

    /**
     * Gets the hashes of the stash parents.
     */
    public get parentHashes(): string[] {
        return this._parentHashes
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
    public get date(): Date {
        return this._date
    }

    /**
     * Gets the node commit hash.
     */
    public get hash(): string {
        return this._hash
    }

    /**
     * Gets the node commit abbreviated hash.
     */
    public get shortHash(): string {
        return this._shortHash
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
     * Gets the stash note.
     */
    public get note(): string | undefined {
        return this._note
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
