/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import Executor from '../Foundation/Executor'

export default class extends Executor {
    /**
     * Executes a git command.
     *
     * @param args     the string array with the command and argument list
     * @param cwd      the string with the current working directory
     * @param encoding the BufferEncoding string with the optional encoding to replace utf8
     */
    public async exec(args: string[], cwd: string, encoding?: BufferEncoding): Promise<string> {
        return this.call('git', args, cwd, encoding)
    }
}
