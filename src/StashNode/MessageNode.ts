/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import Node from './Node'

export default class MessageNode extends Node {
    constructor(
        protected _name: string,
        protected _parent?: Node,
    ) {
        super(_name)
    }

    /**
     * Gets the parent stash node.
     */
    public get parent(): Node | undefined {
        return this._parent
    }

    public toString() {
        return `MessageNode[${this.name}]`
    }

    public get id(): string {
        return `M.${this.name}`
    }
}
