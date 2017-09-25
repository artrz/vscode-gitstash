'use strict';

import { commands } from 'vscode';
import Git from './Git';

(async function(): Promise<void> {
    if (await (new Git()).isGitRepository()) {
        commands.executeCommand('setContext', 'isGitRepository', true);
    }
})();
