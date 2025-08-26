/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import ExecError from './ExecError'
import { spawn } from 'child_process'

export default class {
    /**
     * Executes a command.
     *
     * @param args     the string array with the command and argument list
     * @param cwd      the string with the current working directory
     * @param encoding the BufferEncoding string with the optional encoding to replace utf8
     */
    protected async call(command: string, args: string[], cwd?: string, encoding?: BufferEncoding): Promise<string> {
        const outBuffer: Buffer[] = []
        const errBuffer: Buffer[] = []
        let error: Error | undefined

        const cmd = spawn(command, args, { cwd })

        return new Promise<string>((resolve, reject) => {
            cmd.stdout.on('data', (chunk: Buffer) => outBuffer.push(chunk))
            cmd.stderr.on('data', (chunk: Buffer) => errBuffer.push(chunk))
            cmd.once('error', (err: Error) => error = err)
            cmd.on('close', (code: number) => {
                cmd.removeAllListeners()

                if (error) {
                    reject(new ExecError(code, error.message))
                    return
                }

                const result = Buffer.concat(outBuffer).toString(encoding ?? 'utf8')
                const errResult = Buffer.concat(errBuffer).toString(encoding ?? 'utf8')

                if (errResult.length) {
                    reject(new ExecError(code, errResult, result))
                }
                else {
                    resolve(result)
                }
            })
        })
    }
}
