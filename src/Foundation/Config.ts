/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import { WorkspaceConfiguration, workspace } from 'vscode'

export default abstract class {
    private _prefix: string
    protected settings!: WorkspaceConfiguration
    public readonly key = {
        // keys to be used on code, values as appear on the package file
    } as const

    constructor(prefix: string) {
        this._prefix = prefix
        this.reload()
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    public abstract get<T>(section: typeof this.key[keyof typeof this.key]): T

    public reload(): void {
        this.settings = workspace.getConfiguration(this._prefix)
    }

    public get prefix(): string {
        return this._prefix
    }
}
