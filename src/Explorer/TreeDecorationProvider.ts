/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import {
    Disposable,
    EventEmitter,
    FileDecoration,
    FileDecorationProvider,
    ThemeColor,
    Uri,
    window,
} from 'vscode'
import Config from '../Config'
import FileNodeType from '../StashNode/FileNodeType'
import UriGenerator from '../uriGenerator'

export default class implements FileDecorationProvider, Disposable {
    private readonly onDidChangeDecorationEmitter = new EventEmitter<undefined | Uri | Uri[]>()
    readonly onDidChangeFileDecorations = this.onDidChangeDecorationEmitter.event
    private readonly disposable: Disposable
    private config: Config

    constructor(config: Config) {
        this.config = config
        this.disposable = Disposable.from(window.registerFileDecorationProvider(this))
    }

    dispose(): void {
        this.disposable.dispose()
    }

    provideFileDecoration(uri: Uri): FileDecoration | undefined {
        if (this.config.get<string>('explorer.items.file.decoration') === 'none') {
            return undefined
        }

        if (uri.scheme !== UriGenerator.fileScheme) {
            return undefined
        }

        const nodeType = uri.query.split('type=')[1].split('&')[0] as FileNodeType

        switch (nodeType) {
            case FileNodeType.Untracked:
                return this.getDecorator('U', 'gitDecoration.untrackedResourceForeground')

            case FileNodeType.IndexAdded:
                return this.getDecorator('A', 'gitDecoration.addedResourceForeground')

            case FileNodeType.Deleted:
                return this.getDecorator('D', 'gitDecoration.deletedResourceForeground')

            case FileNodeType.Modified:
                return this.getDecorator('M', 'gitDecoration.modifiedResourceForeground')

            case FileNodeType.Renamed:
                return this.getDecorator('R', 'gitDecoration.renamedResourceForeground')
        }

        return undefined
    }

    /**
     * Create a decorator.
     *
     * @param badge the string with the badge content
     * @param color the string with the theme color key
     */
    private getDecorator(badge: string, color: string): FileDecoration {
        return {
            badge: this.config.get<string>('explorer.items.file.decoration').includes('badge') ? badge : undefined,
            color: this.config.get<string>('explorer.items.file.decoration').includes('color') ? new ThemeColor(color) : undefined,
            propagate: false,
        }
    }
}
