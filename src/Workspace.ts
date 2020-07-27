'use strict'

import * as fs from 'fs'
import * as path from 'path'
import { WorkspaceFolder, workspace } from 'vscode'

export default class Workspace {
    /**
     * Gets a list of directories starting from the workspace paths.
     *
     * @param searchLevels the number of sub- or upper- levels to search for directories.
     */
    public static getRootPaths(searchLevels: number): string[] {
        const workspacePaths = this.getWorkspacePaths()

        if (searchLevels < 0) {
            return Workspace.getUpperRootPaths(workspacePaths, searchLevels)
        }

        if (searchLevels > 0) {
            return Workspace.getSubRootPaths(workspacePaths, searchLevels)
        }

        return workspacePaths
    }

    /**
     * Gets a list of parent directories paths starting from the workspace paths.
     *
     * @param workspacePaths the base workspace paths.
     * @param searchLevels   the number of upper-levels to search for parent directories.
     */
    private static getUpperRootPaths(workspacePaths: string[], searchLevels: number): string[] {
        const roots: string[] = []
        workspacePaths.forEach((workspacePath) => {
            const dirsList = [workspacePath]

            for (let i = searchLevels; i < 0; i += 1) {
                const parentPath = path.dirname(workspacePath)

                if (parentPath === workspacePath) {
                    break
                }

                dirsList.unshift(parentPath)
                workspacePath = parentPath
            }
            dirsList.forEach((workspacePath) => {
                if (roots.indexOf(workspacePath) === -1) {
                    roots.push(workspacePath)
                }
            })
        })

        return roots
    }

    /**
     * Gets a list of subdirectories paths starting from the workspace paths.
     *
     * @param workspacePaths the base workspace paths.
     * @param searchLevels   the number of sub-levels to search for subdirectories.
     */
    private static getSubRootPaths(workspacePaths: string[], searchLevels: number): string[] {
        const roots: string[] = []

        workspacePaths.forEach((workspacePath) => {
            const subDirectories = Workspace.getSubdirectoriesTree(
                workspacePath,
                searchLevels,
                [workspacePath],
            )
            roots.push(...subDirectories)
        })

        return roots
    }

    /**
     * Gets the workspace directory paths.
     */
    private static getWorkspacePaths(): string[] {
        const folders = workspace.workspaceFolders || []
        const paths: string[] = []

        folders.forEach((folder: WorkspaceFolder) => {
            if (fs.existsSync(folder.uri.fsPath)) {
                paths.push(folder.uri.fsPath)
            }
        })

        return paths
    }

    /**
     * Gets the flattened subdirectories tree till the given subdirectory level.
     *
     * @param rootPath the root path to use to get the subdirectories tree list
     * @param levels   the number of levels to use for searching subdirectories
     * @param list     the directories list accumulator
     */
    private static getSubdirectoriesTree(rootPath: string, levels: number, list?: string[]): string[] {
        list = list || []
        levels -= 1

        if (levels >= 0) {
            fs.readdirSync(rootPath).forEach((subPath) => {
                if (subPath !== '.git') {
                    const subDirectoryPath = path.join(rootPath, subPath)

                    if (fs.statSync(subDirectoryPath).isDirectory()) {
                        list.push(subDirectoryPath)
                        Workspace.getSubdirectoriesTree(subDirectoryPath, levels, list)
                    }
                }
            })
        }

        return list
    }
}
