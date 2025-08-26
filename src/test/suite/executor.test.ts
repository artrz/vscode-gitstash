import * as assert from 'assert'

import Executor from '../../Foundation/Executor'
import Git from '../../Git/Git'

class TestExecutor extends Executor {
    public async exec(args: string[]): Promise<string> {
        return this.call(args[0], args.slice(1), '')
    }
}

suite('Executor Test Suite', () => {
    const executor = new TestExecutor()
    const git = new Git()

    test('Successful exec test', async () => {
        const echoText = 'hello world\nfoo\n'
        const result = await executor.exec(['echo', '-n', echoText])
        assert.strictEqual(echoText, result)
    })

    test('Failing exec test', async () => {
        let error = undefined
        try { await executor.exec(['wrong-command-called', 'foo']) }
        catch (err) { error = err }
        assert.strictEqual(error instanceof Error, true)
    })

    test('Successful git call', async () => {
        const result = await git.exec(['stash', 'list'], '.')
        assert.strictEqual(typeof result === 'string', true)
        // console.log(result)
    })
})
