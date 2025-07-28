import { Disposable, Uri, WorkspaceFolder, WorkspaceFoldersChangeEvent, window } from 'vscode'
import { FSWatcher, existsSync, watch } from 'fs'
import { join } from 'path'

type CallbackFunction = (event: Uri) => void

// https://github.com/Microsoft/vscode/issues/3025
export default class implements Disposable {
    private callback: CallbackFunction
    private watchers: Map<string, FSWatcher> = new Map() as Map<string, FSWatcher>

    /**
     * Creates a new watcher.
     *
     * @param repositories the open repositories when starting the extension
     * @param callback     the callback to run when identifying changes
     */
    constructor(repositories: Promise<string[]>, callback: CallbackFunction) {
        this.callback = callback

        void repositories.then((directories) => {
            directories.forEach((directory) => {
                this.registerProjectWatcher(directory)
            })
        })
    }

    /**
     * Adds or removes listeners according the workspace directory changes.
     *
     * @param directoryChanges the workspace directory changes description
     */
    public configure(directoryChanges: WorkspaceFoldersChangeEvent): void {
        directoryChanges.added.forEach((changedDirectory: WorkspaceFolder) => {
            const directory = changedDirectory.uri.fsPath
            this.registerProjectWatcher(directory)
        })

        directoryChanges.removed.forEach((changedDirectory: WorkspaceFolder) => {
            const directory = changedDirectory.uri.fsPath
            this.removeProjectWatcher(directory)
        })
    }

    /**
     * Disposes this object.
     */
    public dispose(): void {
        for (const path of this.watchers.keys()) {
            this.removeProjectWatcher(path)
        }
    }

    /**
     * Registers a new project directory watcher.
     *
     * @param projectPath the directory path
     */
    private registerProjectWatcher(projectPath: string): void {
        if (this.watchers.has(projectPath)) {
            return
        }

        const pathToMonitor = join(projectPath, '.git', 'refs')

        if (!existsSync(pathToMonitor)) {
            return
        }

        try {
            const watcher = watch(pathToMonitor, (event: string, filename) => {
                if (filename?.includes('stash')) {
                    this.callback(Uri.file(projectPath))
                }
            })

            this.watchers.set(projectPath, watcher)
        }
        catch (error) {
            console.error(error)
            void window.showErrorMessage(`Unable to a create a stashes monitor for
            ${projectPath}. This may happen on NFS or if the path is a link`)
        }
    }

    /**
     * Removes an active project directory watcher.
     *
     * @param path the directory path
     */
    private removeProjectWatcher(path: string): void {
        if (this.watchers.has(path)) {
            this.watchers.get(path)?.close()
            this.watchers.delete(path)
        }
    }
}
