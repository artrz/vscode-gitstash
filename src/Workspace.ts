/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

'use strict'

import * as fs from 'fs'
import * as path from 'path'
import { WorkspaceFolder, workspace } from 'vscode'

/**
 * Gets a list of directories starting from the workspace paths.
 *
 * @param searchLevels the number of sub- or upper- levels to search for directories.
 */
export function getRootPaths(searchLevels: number): string[] {
    const workspacePaths = getWorkspacePaths()

    if (searchLevels < 0) {
        return getUpperRootPaths(workspacePaths, searchLevels)
    }

    if (searchLevels > 0) {
        return getSubRootPaths(workspacePaths, searchLevels)
    }

    return workspacePaths
}

/**
 * Gets the workspace directory paths.
 */
function getWorkspacePaths(): string[] {
    return (workspace.workspaceFolders ?? [])
        .filter((folder: WorkspaceFolder) => fs.existsSync(folder.uri.fsPath))
        .map((folder: WorkspaceFolder) => folder.uri.fsPath)
}

/**
 * Gets a list of parent directories paths starting from the workspace paths.
 *
 * @param workspacePaths the base workspace paths.
 * @param searchLevels   the number of upper-levels to search for parent directories.
 */
function getUpperRootPaths(workspacePaths: string[], searchLevels: number): string[] {
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
            if (!roots.includes(workspacePath)) {
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
function getSubRootPaths(workspacePaths: string[], searchLevels: number): string[] {
    const roots: string[] = []

    workspacePaths.forEach((workspacePath) => {
        const subDirectories = getSubdirectoriesTree(
            workspacePath,
            searchLevels,
            [workspacePath],
        )
        roots.push(...subDirectories)
    })

    return roots
}

/**
 * Gets the flattened subdirectories tree till the given subdirectory level.
 *
 * @param rootPath the root path to use to get the subdirectories tree list
 * @param levels   the number of levels to use for searching subdirectories
 * @param list     the directories list accumulator
 */
function getSubdirectoriesTree(rootPath: string, levels: number, list?: string[]): string[] {
    if (list === undefined) {
        list = [] as string[]
    }
    // list ??= [] as string[]
    levels -= 1

    if (levels >= 0) {
        fs.readdirSync(rootPath).forEach((subPath) => {
            if (subPath !== '.git') {
                const subDirectoryPath = path.join(rootPath, subPath)

                // TS complains list can be undefined so adding it to the if to make the compiler happy.
                if (list && fs.statSync(subDirectoryPath).isDirectory()) {
                    list.push(subDirectoryPath)
                    getSubdirectoriesTree(subDirectoryPath, levels, list)
                }
            }
        })
    }

    return list
}
