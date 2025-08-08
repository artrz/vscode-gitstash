/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

enum FileNodeType {
    Added = 'a',
    Deleted = 'd',
    Modified = 'm',
    Renamed = 'n',
    Untracked = 'u',
}

export default FileNodeType
