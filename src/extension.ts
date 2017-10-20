'use strict';

import './init';
import { commands, ExtensionContext, window, workspace } from 'vscode';
import { Commands } from './Commands';
import Config from './Config';
import StashLabels from './StashLabels';

import GitStashTreeDataProvider from './GitStashTreeDataProvider';

export function activate(context: ExtensionContext) {
    const config = new Config();

    const channel = window.createOutputChannel('GitStash');

    const stashLabels = new StashLabels(config);
    const treeProvider = new GitStashTreeDataProvider(config, stashLabels);
    const stashCommands = new Commands(config, stashLabels, channel);

    const watcher = workspace.createFileSystemWatcher('**/refs/stash', false, false, false);

    context.subscriptions.push(
        window.registerTreeDataProvider('gitstash.explorer', treeProvider),

        commands.registerCommand('gitstash.explorer.toggle', treeProvider.toggle),
        commands.registerCommand('gitstash.explorer.refresh', treeProvider.refresh),

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
            config.reload();
            treeProvider.reload('s');
        })
    );

    treeProvider.toggle();
}
