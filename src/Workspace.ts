'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { workspace, WorkspaceFolder } from 'vscode';

export default class Workspace {
    /**
     * Gets a list of directories and subDirectories paths starting from the workspace paths.
     *
     * @param sublevels the number of sublevels to search for subdirectories.
     */
    public static getRootPaths(sublevels: number): string[] {
        const workspacePaths = this.getWorkspacePaths();

        if (sublevels < 1) {
            return workspacePaths;
        }

        const roots = [];

        workspacePaths.forEach((workspacePath) => {
            const subDirectories = Workspace.getSubdirectoriesTree(
                workspacePath,
                sublevels,
                [workspacePath]
            );
            roots.push(...subDirectories);
        });

        return roots;
    }

    /**
     * Gets the workspace directory paths.
     */
    private static getWorkspacePaths(): string[] {
        const folders = workspace.workspaceFolders || [];
        const paths = [];

        folders.forEach((folder: WorkspaceFolder) => {
            if (fs.existsSync(folder.uri.fsPath)) {
                paths.push(folder.uri.fsPath);
            }
        });

        return paths;
    }

    /**
     * Gets the flattened subdirectories tree till the given subdirectory level.
     *
     * @param rootPath the root path to use to get the subdirectories tree list
     * @param levels   the number of levels to use for searching subdirectories
     * @param list     the directories list accumulator
     */
    private static getSubdirectoriesTree(rootPath: string, levels: number, list?: string[]): string[] {
        list = list || [];
        levels -= 1;

        if (levels >= 0) {
            fs.readdirSync(rootPath).forEach((subPath) => {
                if (subPath !== '.git') {
                    const subDirectoryPath = path.join(rootPath, subPath);

                    if (fs.statSync(subDirectoryPath).isDirectory()) {
                        list.push(subDirectoryPath);
                        Workspace.getSubdirectoriesTree(subDirectoryPath, levels, list);
                    }
                }
            });
        }

        return list;
    }
}
