/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

export default abstract class Node {
    constructor(
        protected _name: string,
    ) {
    }

    /**
     * Gets the node name.
     */
    public get name(): string {
        return this._name
    }

    public toString() {
        return `Node[${this.name}]`
    }

    public get id(): string {
        return `?.${this.toString()}`
    }
}
