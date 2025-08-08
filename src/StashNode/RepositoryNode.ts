/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import Node from './Node'
import StashNode from './StashNode'

export default class RepositoryNode extends Node {
    constructor(
        protected _name: string,
        protected _path: string,
        protected _children: StashNode[] | undefined = undefined,
    ) {
        super(_name)
    }

    /**
     * Gets the file path of the stashed file.
     */
    public get path(): string {
        return this._path
    }

    /**
     * Gets the children.
     */
    public get children(): StashNode[] | undefined {
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
     * Sets the children.
     */
    public setChildren(children: StashNode[]): this {
        this._children = children
        return this
    }

    public toString() {
        return `RepositoryNode[${this.name}]`
    }

    public get id(): string {
        return `R.${this.path}`
    }
}
