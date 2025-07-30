/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import NodeType from './NodeType'

export default interface Node {
    type: NodeType;
    name: string;
    oldName?: string;
    index?: number;
    parent?: Node;
    date?: string;
    hash?: string;
    path?: string;
}
