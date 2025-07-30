/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import * as vscode from 'vscode'

export default class implements vscode.TextDocumentContentProvider {
    private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this.onDidChangeEmitter.event
    }

    provideTextDocumentContent(): vscode.ProviderResult<string> {
        return ''
    }
}
