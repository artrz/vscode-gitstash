'use strict'

import { ConfigurationChangeEvent, ExtensionContext, Uri, WorkspaceFoldersChangeEvent, commands, window, workspace } from 'vscode'
import { Commands } from './Commands'
import Config from './Config'
import { DiffDisplayer } from './DiffDisplayer'
import { DocumentContentProvider } from './documentContentProvider'
import { EmptyDocumentContentProvider } from './EmptyDocumentContentProvider'
import { FileSystemWatcherManager } from './fileSystemWatcherManager'
import GitBridge from './GitBridge'
import GitStashTreeDataProvider from './GitStashTreeDataProvider'
import RepositoriesTreeBuilder from './StashNode/RepositoryTreeBuilder'
import { StashCommands } from './StashCommands'
import StashLabels from './StashLabels'
import UriGenerator from './uriGenerator'
import WorkspaceGit from './Git/WorkspaceGit'

export function activate(context: ExtensionContext): void {
    const channelName = 'GitStash'

    const config = new Config()

    const gitBridge = new GitBridge()
    const builder = new RepositoriesTreeBuilder(new WorkspaceGit(config))
    const stashLabels = new StashLabels(config)

    const treeProvider = new GitStashTreeDataProvider(config, builder, gitBridge, stashLabels)
    const documentProvider = new DocumentContentProvider()
    const emptyDocumentProvider = new EmptyDocumentContentProvider()

    const stashCommands = new Commands(
        new WorkspaceGit(config),
        new StashCommands(config, window.createOutputChannel(channelName), stashLabels),
        new DiffDisplayer(new UriGenerator(gitBridge), stashLabels),
        stashLabels,
    )

    const workspaceGit = new WorkspaceGit(config)
    notifyHasRepository(workspaceGit)

    const watcherManager = new FileSystemWatcherManager(
        workspaceGit.getRepositories(),
        (projectDirectory: Uri) => treeProvider.reload('update', projectDirectory),
    )

    context.subscriptions.push(
        window.registerTreeDataProvider('gitstash.explorer', treeProvider),
        workspace.registerTextDocumentContentProvider(UriGenerator.fileScheme, documentProvider),
        workspace.registerTextDocumentContentProvider(UriGenerator.emptyFileScheme, emptyDocumentProvider),

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

        commands.registerCommand('gitstash.toClipboard', stashCommands.toClipboard),

        workspace.onDidChangeWorkspaceFolders((e: WorkspaceFoldersChangeEvent) => {
            notifyHasRepository(workspaceGit)
            watcherManager.configure(e)
            treeProvider.reload('settings')
        }),

        workspace.onDidChangeConfiguration((e: ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('gitstash')) {
                config.reload()
                treeProvider.reload('settings')
            }
        }),

        watcherManager,
    )

    treeProvider.toggle()
}

/**
 * Checks if there is at least one git repository open and notifies it to vsc.
 */
function notifyHasRepository(workspaceGit: WorkspaceGit) {
    void workspaceGit
        .hasGitRepository()
        .then((has) => commands.executeCommand('setContext', 'hasGitRepository', has))
}
