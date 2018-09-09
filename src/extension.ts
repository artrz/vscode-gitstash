'use strict';

import './init';
import { commands, ExtensionContext, window, workspace } from 'vscode';
import { Commands } from './Commands';
import Config from './Config';
import StashLabels from './StashLabels';

import GitStashTreeDataProvider from './GitStashTreeDataProvider';
import { EmptyDocumentContentProvider } from './EmptyDocumentContentProvider';

export function activate(context: ExtensionContext) {
    const config = new Config();

    const channel = window.createOutputChannel('GitStash');

    const stashLabels = new StashLabels(config);
    const treeProvider = new GitStashTreeDataProvider(config, stashLabels);
    const emptyDocumentProvider = new EmptyDocumentContentProvider();

    const stashCommands = new Commands(config, stashLabels, channel);

    const watcher = workspace.createFileSystemWatcher('**/refs/stash', false, false, false);

    context.subscriptions.push(
        window.registerTreeDataProvider('gitstash.explorer', treeProvider),
        workspace.registerTextDocumentContentProvider('empty-stash', emptyDocumentProvider),

        commands.registerCommand('gitstash.explorer.toggle', treeProvider.toggle),
        commands.registerCommand('gitstash.explorer.refresh', treeProvider.refresh),

        commands.registerCommand('gitstash.show', stashCommands.show),
        commands.registerCommand('gitstash.stash', stashCommands.stash),
        commands.registerCommand('gitstash.pop', stashCommands.pop),
        commands.registerCommand('gitstash.apply', stashCommands.apply),
        commands.registerCommand('gitstash.branch', stashCommands.branch),
        commands.registerCommand('gitstash.drop', stashCommands.drop),
        commands.registerCommand('gitstash.clear', stashCommands.clear),

        watcher.onDidCreate((event) => treeProvider.reload('create', event)),
        watcher.onDidChange((event) => treeProvider.reload('update', event)),
        watcher.onDidDelete((event) => treeProvider.reload('delete', event)),

        workspace.onDidChangeConfiguration(() => {
            config.reload();
            treeProvider.reload('settings');
        })
    );

    treeProvider.toggle();
}
