'use strict';

import * as vscode from 'vscode';

export class EmptyDocumentContentProvider implements vscode.TextDocumentContentProvider {
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    provideTextDocumentContent(): vscode.ProviderResult<string> {
        return '';
    }
}
