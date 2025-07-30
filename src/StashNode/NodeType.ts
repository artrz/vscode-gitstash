/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

enum NodeType {
    Repository = 'r',
    Stash = 's',
    Deleted = 'd',
    IndexAdded = 'a',
    Modified = 'm',
    Renamed = 'n',
    Untracked = 'u',
    Message = 'i',
}

export default NodeType
