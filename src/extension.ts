'use strict'

import { ConfigurationChangeEvent, ExtensionContext, Uri, WorkspaceFoldersChangeEvent, commands, window, workspace } from 'vscode'
import { Commands } from './Commands'
import Config from './Config'
import DiffDisplayer from './DiffDisplayer'
import DocumentContentProvider from './Document/DocumentContentProvider'
import EmptyDocumentContentProvider from './Document/EmptyDocumentContentProvider'
import FileSystemWatcherManager from './FileSystemWatcherManager'
import GitBridge from './GitBridge'
import { StashCommands } from './StashCommands'
import StashLabels from './StashLabels'
import StashNodeRepository from './StashNode/StashNodeRepository'
import TreeDataProvider from './Explorer/TreeDataProvider'
import TreeDecorationProvider from './Explorer/TreeDecorationProvider'
import UriGenerator from './uriGenerator'
import WorkspaceGit from './Git/WorkspaceGit'

export function activate(context: ExtensionContext): void {
    const channelName = 'GitStash'

    const config = new Config()

    const gitBridge = new GitBridge()
    const nodeRepository = new StashNodeRepository(new WorkspaceGit(config))
    const stashLabels = new StashLabels(config)
    const uriGenerator = new UriGenerator(gitBridge)

    const treeProvider = new TreeDataProvider(config, nodeRepository, gitBridge, uriGenerator, stashLabels)

    const wsGit = new WorkspaceGit(config)
    const stashCommands = new Commands(
        wsGit,
        new StashCommands(config, wsGit, window.createOutputChannel(channelName), stashLabels),
        new DiffDisplayer(uriGenerator, stashLabels),
        stashLabels,
    )

    const workspaceGit = new WorkspaceGit(config)
    notifyHasRepository(workspaceGit)

    const watcherManager = new FileSystemWatcherManager(
        workspaceGit.getRepositories(),
        (projectDirectory: Uri) => treeProvider.reload('update', projectDirectory),
    )

    context.subscriptions.push(
        new TreeDecorationProvider(config),
        treeProvider.createTreeView(),

        workspace.registerTextDocumentContentProvider(UriGenerator.fileScheme, new DocumentContentProvider()),
        workspace.registerTextDocumentContentProvider(UriGenerator.emptyFileScheme, new EmptyDocumentContentProvider()),

        commands.registerCommand('gitstash.explorer.toggle', treeProvider.toggle),
        commands.registerCommand('gitstash.explorer.refresh', treeProvider.refresh),

        commands.registerCommand('gitstash.stash', stashCommands.stash),
        commands.registerCommand('gitstash.clear', stashCommands.clear),
        commands.registerCommand('gitstash.openDir', stashCommands.openDir),

        commands.registerCommand('gitstash.show', stashCommands.show),
        commands.registerCommand('gitstash.pop', stashCommands.pop),
        commands.registerCommand('gitstash.apply', stashCommands.apply),
        commands.registerCommand('gitstash.branch', stashCommands.branch),
        commands.registerCommand('gitstash.drop', stashCommands.drop),

        commands.registerCommand('gitstash.applyOrPop', stashCommands.applyOrPop),
        commands.registerCommand('gitstash.diffCurrent', stashCommands.diffCurrent),
        commands.registerCommand('gitstash.applySingle', stashCommands.applySingle),
        commands.registerCommand('gitstash.createSingle', stashCommands.createSingle),
        commands.registerCommand('gitstash.openCurrent', stashCommands.openFile),

        commands.registerCommand('gitstash.stashSelected', stashCommands.stashSelected),

        commands.registerCommand('gitstash.clipboardRepositoryPath', stashCommands.toClipboardFromObject),
        commands.registerCommand('gitstash.clipboardStashMessage', stashCommands.toClipboardFromObject),
        commands.registerCommand('gitstash.clipboardFilePath', stashCommands.toClipboardFromObject),
        commands.registerCommand('gitstash.clipboardInfo', stashCommands.clipboardFromTemplate),

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
