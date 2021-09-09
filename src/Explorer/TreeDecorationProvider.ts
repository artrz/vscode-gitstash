'use strict'

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
import NodeType from '../StashNode/NodeType'
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
        if (this.config.get<string>('explorer.decorations') === 'none') {
            return undefined
        }

        if (uri.scheme !== UriGenerator.fileScheme) {
            return undefined
        }

        const nodeType = uri.query.split('type=')[1].split('&')[0]

        switch (nodeType) {
            case NodeType.Untracked:
                return this.makeDecorator('U', 'gitDecoration.untrackedResourceForeground')

            case NodeType.IndexAdded:
                return this.makeDecorator('A', 'gitDecoration.addedResourceForeground')

            case NodeType.Deleted:
                return this.makeDecorator('D', 'gitDecoration.deletedResourceForeground')

            case NodeType.Modified:
                return this.makeDecorator('M', 'gitDecoration.modifiedResourceForeground')

            case NodeType.Renamed:
                return this.makeDecorator('R', 'gitDecoration.renamedResourceForeground')
        }

        return undefined
    }

    private makeDecorator(badge: string, color: string): FileDecoration {
        return {
            badge: this.config.get<string>('explorer.decorations').indexOf('badge') > -1 ? badge : undefined,
            color: this.config.get<string>('explorer.decorations').indexOf('color') > -1 ? new ThemeColor(color) : undefined,
            propagate: false,
        }
    }
}
