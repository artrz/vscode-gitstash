'use strict';

import './init';
import { commands, ExtensionContext, window, workspace } from 'vscode';
import { Commands } from './Commands';

import GitStashTreeDataProvider from './GitStashTreeDataProvider';

export function activate(context: ExtensionContext) {
    const channel = window.createOutputChannel('GitStash');
    const treeProvider = new GitStashTreeDataProvider();
    const stashCommands = new Commands(channel, treeProvider);
    const watcher = workspace.createFileSystemWatcher('**/refs/stash', false, false, false);

    context.subscriptions.push(
        window.registerTreeDataProvider('gitstash.explorer', treeProvider),

        commands.registerCommand('gitstash.explorer.toggle', stashCommands.gitstashExplorerToggle),
        commands.registerCommand('gitstash.explorer.refresh', stashCommands.gitstashExplorerRefresh),
        commands.registerCommand('gitstash.show', stashCommands.gitstashShow),
        commands.registerCommand('gitstash.stash', stashCommands.gitstashStash),
        commands.registerCommand('gitstash.pop', stashCommands.gitstashPop),
        commands.registerCommand('gitstash.apply', stashCommands.gitstashApply),
        commands.registerCommand('gitstash.branch', stashCommands.gitstashBranch),
        commands.registerCommand('gitstash.drop', stashCommands.gitstashDrop),
        commands.registerCommand('gitstash.clear', stashCommands.gitstashClear),

        watcher.onDidCreate((event) => treeProvider.reload('c', event)),
        watcher.onDidChange((event) => treeProvider.reload('u', event)),
        watcher.onDidDelete((event) => treeProvider.reload('d', event)),

        workspace.onDidChangeConfiguration(() => {
            treeProvider.reload('s');
            stashCommands.loadConfig();
        })
    );

    stashCommands.gitstashExplorerToggle();
}
