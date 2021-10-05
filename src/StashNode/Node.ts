'use strict'

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
