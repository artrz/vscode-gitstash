'use strict';

import './init';
import { commands, ExtensionContext, window, workspace } from 'vscode';
import { Commands } from './Commands';
import Config from './Config';
import StashLabels from './StashLabels';

import GitStashTreeDataProvider from './GitStashTreeDataProvider';
import { EmptyDocumentContentProvider } from './EmptyDocumentContentProvider';
import Model from './Model';
import { StashCommands } from './StashCommands';
import { DiffDisplayer } from './DiffDisplayer';

export function activate(context: ExtensionContext) {
    const model = new Model();
    const config = new Config();
    const stashLabels = new StashLabels(config);

    const treeProvider = new GitStashTreeDataProvider(config, model, stashLabels);
    const emptyDocumentProvider = new EmptyDocumentContentProvider();
    const stashCommands = new Commands(
        new StashCommands(config, window.createOutputChannel('GitStash')),
        new DiffDisplayer(model, stashLabels),
        stashLabels
    );

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

        commands.registerCommand('gitstash.applyOrPop', stashCommands.applyOrPop),
        commands.registerCommand('gitstash.diffCurrent', stashCommands.diffCurrent),

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
