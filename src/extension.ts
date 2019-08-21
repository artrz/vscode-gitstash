'use strict';

import { commands, ConfigurationChangeEvent, ExtensionContext, Uri, window, workspace, WorkspaceFoldersChangeEvent } from 'vscode';
import { Commands } from './Commands';

import Config from './Config';
import Model from './Model';
import StashLabels from './StashLabels';
import GitStashTreeDataProvider from './GitStashTreeDataProvider';
import { EmptyDocumentContentProvider } from './EmptyDocumentContentProvider';
import { StashCommands } from './StashCommands';
import { DiffDisplayer } from './DiffDisplayer';
import WorkspaceGit from './WorkspaceGit';

export function activate(context: ExtensionContext) {
    const config = new Config();

    const model = new Model(new WorkspaceGit(config));
    const stashLabels = new StashLabels(config);

    const treeProvider = new GitStashTreeDataProvider(config, model, stashLabels);
    const emptyDocumentProvider = new EmptyDocumentContentProvider();
    const stashCommands = new Commands(
        new WorkspaceGit(config),
        new StashCommands(config, window.createOutputChannel('GitStash'), stashLabels),
        new DiffDisplayer(model, stashLabels),
        stashLabels
    );

    const workspaceGit = new WorkspaceGit(config);
    notifyHasRepository(workspaceGit);

    const watcher = workspace.createFileSystemWatcher('**/refs/stash', false, false, false);

    context.subscriptions.push(
        window.registerTreeDataProvider('gitstash.explorer', treeProvider),
        workspace.registerTextDocumentContentProvider('empty-stash', emptyDocumentProvider),

        commands.registerCommand('gitstash.explorer.toggle', treeProvider.toggle),
        commands.registerCommand('gitstash.explorer.refresh', treeProvider.refresh),

        commands.registerCommand('gitstash.stash', stashCommands.stash),
        commands.registerCommand('gitstash.clear', stashCommands.clear),

        commands.registerCommand('gitstash.show', stashCommands.show),
        commands.registerCommand('gitstash.pop', stashCommands.pop),
        commands.registerCommand('gitstash.apply', stashCommands.apply),
        commands.registerCommand('gitstash.branch', stashCommands.branch),
        commands.registerCommand('gitstash.drop', stashCommands.drop),

        commands.registerCommand('gitstash.applyOrPop', stashCommands.applyOrPop),
        commands.registerCommand('gitstash.diffCurrent', stashCommands.diffCurrent),
        commands.registerCommand('gitstash.applySingle', stashCommands.applySingle),
        commands.registerCommand('gitstash.createSingle', stashCommands.createSingle),

        watcher.onDidCreate((event: Uri) => treeProvider.reload('create', event)),
        watcher.onDidChange((event: Uri) => treeProvider.reload('update', event)),
        watcher.onDidDelete((event: Uri) => treeProvider.reload('delete', event)),

        workspace.onDidChangeWorkspaceFolders((e: WorkspaceFoldersChangeEvent) => {
            notifyHasRepository(workspaceGit);
            treeProvider.reload('settings');
        }),

        workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('gitstash')) {
                config.reload();
                treeProvider.reload('settings');
            }
        })
    );

    treeProvider.toggle();
}

/**
 * Checks if there is at least one git repository open and notifies it to vsc.
 */
function notifyHasRepository(workspaceGit: WorkspaceGit) {
    workspaceGit
        .hasGitRepository()
        .then((has) => commands.executeCommand('setContext', 'hasGitRepository', has));
}
