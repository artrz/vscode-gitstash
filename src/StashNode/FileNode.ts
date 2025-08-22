/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import FileNodeType from './FileNodeType'
import Node from './Node'
import StashNode from './StashNode'

export default class FileNode extends Node {
    constructor(
        protected _name: string,
        protected _type: FileNodeType,
        protected _path: string,
        protected _parent: StashNode,
        protected _oldName?: string,
    ) {
        super(_name)
    }

    public get name(): string {
        return this._name
    }

    public get type(): FileNodeType {
        return this._type
    }

    /**
     * Gets the file path of the stashed file.
     */
    public get path(): string {
        return `${this._path}/${this._name}`
    }

    public get parent(): StashNode {
        return this._parent
    }

    public get oldName(): string | undefined {
        return this._oldName
    }

    public get date(): Date {
        return this.parent.date
    }

    public get isAdded(): boolean {
        return this.type === FileNodeType.Added
    }

    public get isDeleted(): boolean {
        return this.type === FileNodeType.Deleted
    }

    public get isModified(): boolean {
        return this.type === FileNodeType.Modified
    }

    public get isRenamed(): boolean {
        return this.type === FileNodeType.Renamed
    }

    public get isUntracked(): boolean {
        return this.type === FileNodeType.Untracked
    }

    public toString() {
        return `FileNode[${this.name}]`
    }

    public get id(): string {
        return `F-${this.type}.${this.parent.parent.path}.${this.parent.hash}.${this.name}`
    }
}
