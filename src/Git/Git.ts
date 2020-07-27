'use strict'

import { spawn } from 'child_process'

export default class Git {
    /**
     * Executes a git command.
     *
     * @param args the string array with the argument list
     * @param cwd  the string with the current working directory
     */
    public async call(args: string[], cwd: string): Promise<Buffer | string> {
        const response = []
        const errors = []

        const cmd = spawn('git', args, { cwd })
        cmd.stderr.setEncoding('utf8')

        return new Promise<Buffer | string>((resolve, reject) => {
            cmd.stdout.on('data', (chunk: Buffer) => response.push(chunk))
            cmd.stdout.on('error', (err: Error) => errors.push(err.message))

            cmd.stderr.on('data', (chunk: string) => errors.push(chunk))
            cmd.stderr.on('error', (err: Error) => errors.push(err.message))

            cmd.on('close', (code: number) => {
                const bufferResponse = response.length
                    ? Buffer.concat(response)
                    : Buffer.from(new ArrayBuffer(0))

                if (code === 0) {
                    errors.length === 0
                        ? resolve(bufferResponse)
                        : resolve(`${errors.join(' ')}\n${bufferResponse.toString('utf8')}`.trim())
                }
                else {
                    reject(`${errors.join(' ')}\n${bufferResponse.toString('utf8')}`.trim())
                }
            })
        })
    }

    /**
     * Executes a git command.
     *
     * @param args     the string array with the argument list
     * @param cwd      the string with the current working directory
     * @param encoding the string with the optional encoding to replace utf8
     */
    public async exec(args: string[], cwd: string, encoding?: string): Promise<string> {
        return this
            .call(args, cwd)
            .then((data: Buffer | string) => data instanceof Buffer ? data.toString(encoding || 'utf8') : data)
    }
}
