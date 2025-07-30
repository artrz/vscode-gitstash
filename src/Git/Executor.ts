/*
 * Copyright (c) Arturo Rodríguez V.
 * GPL-3.0-only. See LICENSE.md in the project root for license details.
 */

import { spawn } from 'child_process'

export default class {
    /**
     * Executes a command.
     *
     * @param args     the string array with the command and argument list
     * @param cwd      the string with the current working directory
     * @param encoding the BufferEncoding string with the optional encoding to replace utf8
     */
    public async call(command: string, args: string[], cwd?: string, encoding?: BufferEncoding): Promise<string> {
        const response: Buffer[] = []
        const errors: string[] = []

        const cmd = spawn(command, args, { cwd })
        cmd.stderr.setEncoding(encoding ?? 'utf8')

        return new Promise<string>((resolve, reject) => {
            cmd.on('error', (err: Error) => errors.push(err.message))
            cmd.stdout.on('data', (chunk: Buffer) => response.push(chunk))
            cmd.stdout.on('error', (err: Error) => errors.push(err.message))
            cmd.stderr.on('data', (chunk: string) => errors.push(chunk))
            cmd.stderr.on('error', (err: Error) => errors.push(err.message))

            cmd.on('close', (code: number) => {
                const result = response.length
                    ? Buffer.concat(response).toString(encoding ?? 'utf8').trim()
                    : ''

                const error = errors.length ? errors.join().trim() : ''

                if (code === 0) {
                    resolve(errors.length === 0 ? result : `${result}\n\n${error}`)
                }
                else {
                    reject(new Error(response.length === 0 ? error : `${result}\n\n${error}`))
                }
            })
        })
    }
}
