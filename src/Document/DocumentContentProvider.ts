'use strict'

import * as vscode from 'vscode'
import StashGit, { FileStage } from '../Git/StashGit'
import NodeType from '../StashNode/NodeType'
import { URLSearchParams } from 'url'

export default class implements vscode.TextDocumentContentProvider {
    private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()

    public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        const params = new URLSearchParams(uri.query)

        const cwd = params.get('cwd')
        const index = parseInt(params.get('index'), 10)
        const path = params.get('path')
        const oldPath = params.get('oldPath')
        const type = params.get('type')
        const side = params.get('side')

        const stashGit = new StashGit()
        let contents: Promise<string | Buffer>

        try {
            if (type === NodeType.Deleted) {
                contents = stashGit.getParentContents(cwd, index, path)
            }
            else if (type === NodeType.IndexAdded) {
                contents = stashGit.getStashContents(cwd, index, path)
            }
            else if (type === NodeType.Modified) {
                contents = side === FileStage.Parent
                    ? stashGit.getParentContents(cwd, index, path)
                    : stashGit.getStashContents(cwd, index, path)
            }
            else if (type === NodeType.Renamed) {
                contents = side === FileStage.Parent
                    ? stashGit.getParentContents(cwd, index, oldPath)
                    : stashGit.getStashContents(cwd, index, path)
            }
            else if (type === NodeType.Untracked) {
                contents = stashGit.getThirdParentContents(cwd, index, path)
            }
        }
        catch (e) {
            console.log(e)
        }
        console.log(`provideTextDocumentContent type[${type}] side[${side}]`)
        console.log(uri.query)

        return (await contents).toString()
    }

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this.onDidChangeEmitter.event
    }

    public update(uri: vscode.Uri): void {
        this.onDidChangeEmitter.fire(uri)
    }
}
