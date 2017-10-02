'use strict';

import { commands } from 'vscode';
import Git from './Git';

(new Git()).isGitRepository().then(() => {
    commands.executeCommand('setContext', 'isGitRepository', true);
});
